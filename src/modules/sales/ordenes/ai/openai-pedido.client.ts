import OpenAI from "openai";
import * as chrono from "chrono-node";
import type { ChatCompletionContentPart } from "openai/resources/chat/completions";
import preciosOpenAIRaw from "./precios-openai.json";
import type {
  ArchivoExtraido,
  ArchivoTexto,
  ArchivoImagen,
} from "./file-extractors";
import {
  calcularCantidadDesdeCajas,
  pesoPorCajaKg,
} from "../utils/pedido/empaque-lineas";
import {
  extractCorreoContactoDesdeTexto,
  isCorreoRemitenteGenerico,
} from "../utils/origen/correo-chrome";
import {
  extractDireccionShipToDesdeTexto,
  extractEntregaDesdeTexto,
} from "../utils/pedido/extract-entrega-desde-texto";
import { sanitizeTelefonoContacto } from "../utils/pedido/sanitize-telefono-contacto";
import { resolveCentroConsumoSinConfundirConCliente } from "../utils/pedido/centro-consumo-vs-cliente";
import {
  enrichAlmacenConCodigoDesdeTexto,
  enrichLineasAlmacenConCodigoDesdeTexto,
} from "../utils/pedido/enrich-almacen-codigo";
import { aplicarMadurezDesdeTexto } from "../utils/pedido/madurez-linea";
import { normalizeNumeroPedidoFields } from "../utils/pedido/normalize-numero-pedido";
import {
  serializeCuerpoMensaje,
  type CuerpoMensajeBloque,
} from "../utils/origen/texto-origen-pedido";

export { calcularCantidadDesdeCajas, pesoPorCajaKg };

export interface LineaExtraida {
  textoOriginal: string;
  productoCatalogo: string | null;
  cantidad: number | null;
  unidad: (typeof UNIDADES)[number] | null;
  cajas: number | null;
  presentacion: string | null;
  especificacion: string | null;
  /** PO / número de pedido del hotel (agrupa órdenes de trabajo). */
  numeroPedido: string | null;
  /** Centro de consumo / almacén destino del renglón. */
  almacen: string | null;
  numeroAlmacen: string | null;
  referenciaPedido: string | null;
  codigoProductoCliente: string | null;
  responsableExterno: string | null;
  /** Precio unitario del documento (columna Precio), si viene. */
  precioUnitario: number | null;
}

export interface PedidoExtraido {
  fechaEntrega: string | null;
  centroConsumo: string | null;
  observaciones: string | null;
  /**
   * Palabras clave / especificaciones para notas generales del PDF de almacén.
   * Corto (cabe en ~3 renglones). No es el cuerpo del correo.
   */
  notasGeneralesAlmacen?: string | null;
  /** Número/código de orden de compra del hotel/cliente (PO, OC, etc.). */
  ordenCompraHotel: string | null;
  /**
   * Nombre del comprador/hotel/cliente tal como aparece en el mensaje o archivo.
   * El frontend lo cruza contra el catálogo de compradores.
   */
  nombreCliente: string | null;
  rfc: string | null;
  // Entrega (dirección, andén, contacto, teléfono, correo, ventana): Mateo la
  // extrae del correo, mensaje o PDF. La ficha del comprador solo rellena lo
  // que no vino. Régimen, tolerancia, sustituciones, lote y temperatura siguen
  // siendo de ficha salvo que el documento los declare.
  regimen: (typeof REGIMENES)[number] | null;
  direccion: string | null;
  anden: string | null;
  contacto: string | null;
  telefono: string | null;
  correo: string | null;
  horarioDesde: string | null;
  horarioHasta: string | null;
  tolerancia: (typeof TOLERANCIAS)[number] | null;
  sustituciones: (typeof SUSTITUCIONES)[number] | null;
  lote: (typeof SI_NO)[number] | null;
  temperatura: (typeof SI_NO)[number] | null;
  lineas: LineaExtraida[];
  /**
   * Renglones crudos estilo origen_correo (para agrupar hijas / persistir jsonb).
   * Se arma en el servidor a partir de las líneas extraídas.
   */
  origenCorreo: import("../utils/origen/origen-correo-ordenes-trabajo").OrigenCorreoRenglon[];
  advertencia: string | null;
  archivosNoLegibles: string[];
  /**
   * Cuerpo del correo organizado por la IA (texto + tablas) para persistir en origen_texto.
   */
  textoOrigen?: string | null;
}

interface ExtraerPedidoInput {
  texto: string;
  archivosExtraidos: ArchivoExtraido[];
  hoyISO: string;
  /** Claves EXACTAS del catálogo (ej. "AGUACATE EXTRA HASS (115001005)"). */
  catalogoClaves: string[];
  /** Presentaciones disponibles; puede incluir "". */
  presentaciones: string[];
}

export interface UsoOpenAI {
  tokensEntrada: number;
  tokensEntradaCacheados: number;
  tokensEntradaCacheEscritura: number;
  tokensSalida: number;
  tokensTotal: number;
  costoUSD: number | null;
}

interface PrecioModelo {
  input: number;
  cachedInput: number;
  cacheWrites: number;
  output: number;
}

// Precios reales por token, dados por el usuario 2026-09-04 (tier "contexto corto" —
// ver precios-openai.json). Complementa el hallazgo "sin límite de gasto"
// (Alto, dominio Integraciones): la decisión fue solo loguear el costo, nunca bloquear
// — este cálculo es lo que hace que ese log sea un número real en vez de solo tokens.
const PRECIOS_OPENAI = preciosOpenAIRaw as unknown as Record<
  string,
  PrecioModelo
>;

/**
 * costoUSD = null si el modelo configurado no está en la tabla de precios conocida —
 * nunca se inventa un precio para un modelo que no se puede verificar (mismo principio
 * de "no inventes" que rige todo lo demás en este archivo).
 */
export function calcularCostoUSD(
  model: string,
  tokensEntradaTotal: number,
  tokensCacheados: number,
  tokensCacheEscritura: number,
  tokensSalida: number,
): number | null {
  const precio = PRECIOS_OPENAI[model];
  if (!precio) return null;

  const tokensEntradaNormal = Math.max(
    0,
    tokensEntradaTotal - tokensCacheados - tokensCacheEscritura,
  );
  const costo =
    (tokensEntradaNormal * precio.input +
      tokensCacheados * precio.cachedInput +
      tokensCacheEscritura * precio.cacheWrites +
      tokensSalida * precio.output) /
    1_000_000;

  return Math.round(costo * 1_000_000) / 1_000_000; // redondeo a 6 decimales (montos son fracciones de centavo)
}

export interface ResultadoExtraccion {
  pedido: PedidoExtraido;
  uso: UsoOpenAI | null;
}

// AUDITORÍA 2026-09-03 · Hallazgo #14 (Bajo) — "unidad" era string libre; el mismo
// escenario devolvía "KGM" en una corrida y "kilos" en otra. Vocabulario controlado.
const UNIDADES = ["KGM", "CJ", "UN"] as const;

// Vocabulario controlado (2026-09-04) para los campos de ficha de cliente que la IA
// puede sobreescribir cuando el pedido los declara explícito — mismo <select> con
// opciones fijas que usa el formulario, para que un valor devuelto por la IA siempre
// calce con una opción real y nunca deje el campo en blanco por no coincidir exacto.
const REGIMENES = [
  "601 — General de ley personas morales",
  "616 — Sin obligaciones fiscales",
  "612 — Personas físicas con actividad empresarial",
] as const;
const TOLERANCIAS = ["± 2%", "± 5%", "± 10%"] as const;
const SUSTITUCIONES = [
  "No — surtir parcial",
  "Sí, con aviso",
  "Sí, a criterio de almacén",
] as const;
const SI_NO = ["Sí", "No"] as const;

// Modelos que ya se confirmó (en este proceso) que rechazan `temperature` personalizado
// — ver el bloque de manejo de error en extraerPedido() más abajo.
const MODELOS_SIN_TEMPERATURA = new Set<string>();

// Lo que la IA puede decidir es SOLO interpretación de lenguaje (qué dice el texto,
// a qué producto se refiere, cuál frase es la fecha de entrega). Ninguna operación
// aritmética (sumar, multiplicar, resolver una fecha relativa a una fecha absoluta)
// se le pide a la IA — ver resolverFechaEntrega() y calcularCantidadDesdeCajas() más
// abajo, que hacen esa parte con código determinista.
interface LineaExtraidaRaw {
  textoOriginal: string;
  productoCatalogo: string | null;
  cantidad: number | null;
  unidad: (typeof UNIDADES)[number] | null;
  cajas: number | null;
  presentacion: string | null;
  especificacion: string | null;
  numeroPedido: string | null;
  almacen: string | null;
  numeroAlmacen: string | null;
  referenciaPedido: string | null;
  codigoProductoCliente: string | null;
  responsableExterno: string | null;
  precioUnitario: number | null;
}

interface PedidoExtraidoRaw {
  fechaEntregaTexto: string | null;
  centroConsumo: string | null;
  observaciones: string | null;
  notasGeneralesAlmacen: string | null;
  ordenCompraHotel: string | null;
  nombreCliente: string | null;
  rfc: string | null;
  regimen: (typeof REGIMENES)[number] | null;
  direccion: string | null;
  anden: string | null;
  contacto: string | null;
  telefono: string | null;
  correo: string | null;
  horarioDesde: string | null;
  horarioHasta: string | null;
  tolerancia: (typeof TOLERANCIAS)[number] | null;
  sustituciones: (typeof SUSTITUCIONES)[number] | null;
  lote: (typeof SI_NO)[number] | null;
  temperatura: (typeof SI_NO)[number] | null;
  lineas: LineaExtraidaRaw[];
  advertencia: string | null;
  cuerpoMensaje: CuerpoMensajeBloque[];
}

const RESPONSE_SCHEMA = {
  name: "extraccion_pedido",
  strict: true,
  schema: {
    type: "object",
    properties: {
      fechaEntregaTexto: {
        type: ["string", "null"],
        description:
          "La frase EXACTA del mensaje/PDF/tabla que indica cuándo se debe ENTREGAR el pedido (ej. 'mañana temprano', 'el jueves', '15 de septiembre', '21/10/2026', '27 de agosto de 2026'). Copia la frase tal cual, no calcules la fecha ni asumas 'mañana' si hay otra fecha concreta. Extráela AUNQUE sea la única pista de fecha (cuerpo, columna Fecha, Delivery Date). Si el mensaje menciona otras fechas que no son la de entrega, esas van en la especificación de esa línea, no aquí. null SOLO si de verdad no hay ninguna pista de fecha de entrega.",
      },
      centroConsumo: {
        type: ["string", "null"],
        description:
          "Área INTERNA de consumo del hotel (cocina, bar, banquete, almacén de fila, centro de costo). Copia CÓDIGO + NOMBRE completos tal cual (ej. 'ABAN Banquetes Alim', 'BAWH Bar Whisky', 'COPM Coc Plaza Mx', 'ACOE Comedor Empleados'). NUNCA acortes ni quites el prefijo de 3–6 letras. NUNCA pongas hotel/denominación/Bill To (eso es nombreCliente). Si solo hay resort sin cocina/área → null. Incertidumbre → null.",
      },
      observaciones: {
        type: ["string", "null"],
        description:
          "Observación general corta del pedido completo (no de una línea de producto). PRIORIDAD ALTA si el documento trae secciones rotuladas: «Observaciones del cliente», «Observaciones», «Notas del cliente», «Comentarios del cliente», «Indicaciones del cliente», «Instrucciones», «Notas», «Aviso al almacén». Copia ahí lo que diga el cliente (madurez, calidad, empaque, etc.). NUNCA inventes conclusiones, inconsistencias entre correo y adjuntos, ni análisis del documento — eso no es una nota de alistamiento. null solo si de verdad no hay ninguna.",
      },
      notasGeneralesAlmacen: {
        type: ["string", "null"],
        description:
          "SOLO palabras clave / especificaciones de almacén (máx. 160 caracteres, 3 renglones). PRIORIDAD: bloque «Observaciones del cliente» (o Notas/Comentarios/Indicaciones del cliente), madurez (no muy maduro, enrriados, amarillo, etc.), andén, sin sustitutos, juegos de OC. Incluye viñetas del cliente si existen. NO copies el cuerpo del correo, saludos, tablas de productos, firma, vigencia, horario genérico de recepción ni dirección. NUNCA escribas conclusiones tipo «el correo dice X pero el PDF dice Y» — solo aclaraciones útiles para surtir/entregar. null solo si no hay ninguna especificación útil.",
      },
      ordenCompraHotel: {
        type: ["string", "null"],
        description:
          "Identificador de la orden de compra del hotel/cliente para ESTE pedido. INTERPRETA el documento: no busques solo una etiqueta fija. El rótulo cambia según el emisor (ej. 'PO NUMBER', 'PO #', 'P.O.', 'Purchase Order', 'Orden de compra', 'OC', 'Nº OC', 'No. de orden', 'Order No.', 'Customer PO', 'Requisition', 'Req #', 'REQUISICION #', 'R.C.'). Extrae el CÓDIGO/NÚMERO asociado a esa idea (ej. 'CUNMC0046026' o '50184' si dice REQUISICION # 50184). En PDFs XPU HA la OCC es el número junto a 'REQUISICION #' (ej. 50179), NUNCA el código de la columna 'Artículo' (ej. 00001678 con ceros a la izquierda) ni el título 'Requisición de Compra'. NUNCA uses 'Autoriza', 'Autorizado', 'rAutorizado' ni 'Solicita'. null solo si de verdad no aparece ningún identificador de OC/PO/requisición.",
      },
      nombreCliente: {
        type: ["string", "null"],
        description:
          "Denominación comercial / razón social / hotel / propiedad / cuenta que hace el pedido (ej. 'Dreams Jade Resort & Spa', 'Promociones Marina Morelos', 'Marriott Cancun'). Etiquetas: Cliente, Customer, Bill To, Sold To, Hotel, Property, Account Name, Compañía, Denominación. NO es el centro de consumo (cocina/bar). No uses el PO ni el RFC como nombre. null solo si no aparece ningún nombre de cliente/hotel.",
      },
      rfc: {
        type: ["string", "null"],
        description:
          "RFC del cliente/hotel SOLO si aparece literal en el mensaje o en algún documento adjunto (ej. 'nuestro RFC es XAXX010101000'). null si no se menciona — no lo inventes ni lo deduzcas del nombre del cliente.",
      },
      // Entrega: extraer SIEMPRE del correo, mensaje o PDF (Ship To / Deliver To /
      // Enviar a / Andén / Contacto / Tel / hora). null solo si ese dato no aparece.
      // Régimen y políticas siguen siendo null salvo mención explícita.
      regimen: {
        type: ["string", "null"],
        enum: [...REGIMENES, null],
        description:
          "Régimen fiscal del receptor SOLO si el mensaje/documento lo declara explícito (ej. 'nuestro régimen es 601'). Usa la opción de la lista más parecida a lo dicho; null si no se menciona.",
      },
      direccion: {
        type: ["string", "null"],
        description:
          "Dirección de ENTREGA tal como aparece en el correo, mensaje o PDF. Busca Ship To, Deliver To, Enviar a, Entregar en, Domicilio de entrega, Dirección de envío. Copia calle, número, colonia, ciudad y CP si vienen. Si hay Bill To (facturación) y Ship To (entrega), usa Ship To. null solo si el documento no trae ninguna dirección de entrega.",
      },
      anden: {
        type: ["string", "null"],
        description:
          "Andén, muelle, dock, puerta o punto de recepción si aparece en el correo, mensaje o PDF (Andén, Dock, Puerta, Muelle, Receiving). Copia el texto tal cual. null solo si no aparece.",
      },
      contacto: {
        type: ["string", "null"],
        description:
          "Nombre de quien recibe esta entrega si aparece en el correo, mensaje o PDF (Contacto, Attn, Recibe, Atención, Buyer de recepción). null solo si no aparece.",
      },
      telefono: {
        type: ["string", "null"],
        description:
          "Teléfono de la entrega o del contacto si aparece en el correo, mensaje o PDF (Tel, Teléfono, Phone, Cel, WhatsApp). Copia el número tal cual. null solo si no aparece.",
      },
      correo: {
        type: ["string", "null"],
        description:
          "Correo del CONTACTO del hotel/cliente (persona). Si De/From es genérico (bss_system@birchstreet.net, noreply, admonaguacatesdepuebla@gmail.com, cuenta del proveedor), IGNÓRALO y busca Email/E-mail/Correo/mailto en el cuerpo o PDF del hotel. Si De/From es una persona del hotel (ej. 'Nombre <mail@hotel.com>'), úsalo. No uses el Para/To del proveedor. null solo si no hay ningún correo humano del cliente.",
      },
      horarioDesde: {
        type: ["string", "null"],
        description:
          "Hora de INICIO de la ventana de recepción, 24h HH:MM, tomada del correo, mensaje o PDF (Hora de entrega, delivery time, ventana de recepción, a partir de, de X a Y). Ej. 'Hora de entrega 6:00 am' → '06:00'; '8:00 AM – 2:00 PM' → desde '08:00'. Si solo hay una hora, ponla aquí. null SOLO si no hay ninguna hora.",
      },
      horarioHasta: {
        type: ["string", "null"],
        description:
          "Hora de FIN de la ventana de recepción, 24h HH:MM, si el correo, mensaje o PDF indica un rango (hasta, before, entre X y Y, 8am-2pm). Ej. '8:00 AM – 2:00 PM' → '14:00'. null si solo hay una hora o no hay fin.",
      },
      tolerancia: {
        type: ["string", "null"],
        enum: [...TOLERANCIAS, null],
        description:
          "Tolerancia de peso aceptada SOLO si el mensaje/documento la declara explícita (ej. 'aceptamos +/- 5%'). null si no se menciona.",
      },
      sustituciones: {
        type: ["string", "null"],
        enum: [...SUSTITUCIONES, null],
        description:
          "Política de sustitución de producto SOLO si el mensaje/documento la declara explícita para este pedido (ej. 'si no hay, sustituyan avisando antes'). Usa la opción de la lista que mejor represente lo dicho; null si no se menciona.",
      },
      lote: {
        type: ["string", "null"],
        enum: [...SI_NO, null],
        description:
          "'Sí' o 'No' SOLO si el mensaje/documento pide explícito trazabilidad de lote para este pedido. null si no se menciona.",
      },
      temperatura: {
        type: ["string", "null"],
        enum: [...SI_NO, null],
        description:
          "'Sí' o 'No' SOLO si el mensaje/documento pide explícito registro de temperatura al entregar. null si no se menciona.",
      },
      advertencia: {
        type: ["string", "null"],
        description:
          "Cuando el texto y/o los archivos NO parecen tener relación con un pedido de fruta/verdura para un hotel (ej. es un contrato, un currículum, spam, contenido irrelevante, o está vacío/ilegible), explica brevemente por qué en una frase. Si sí es un pedido (aunque venga incompleto), deja null.",
      },
      cuerpoMensaje: {
        type: "array",
        description:
          "Cuerpo del correo/mensaje ORGANIZADO para mostrarlo al usuario: prosa (saludo, instrucciones, firma) y tablas reales. No inventes filas ni celdas. Une celdas partidas por salto de línea (ej. 'Baja' + 'California' → 'Baja California'). Quita cabeceras De/From/Subject y disclaimers legales. Conserva hora de entrega, notas y firma.",
        items: {
          type: "object",
          properties: {
            tipo: {
              type: "string",
              enum: ["texto", "tabla"],
              description:
                "'texto' = párrafos con saltos de línea. 'tabla' = matriz de celdas (primera fila = encabezados).",
            },
            texto: {
              type: ["string", "null"],
              description:
                "Prosa del bloque si tipo=texto. null si tipo=tabla.",
            },
            filas: {
              type: ["array", "null"],
              description:
                "Filas de la tabla si tipo=tabla (cada fila es un array de celdas string). Primera fila = encabezados. null si tipo=texto.",
              items: {
                type: "array",
                items: { type: "string" },
              },
            },
          },
          required: ["tipo", "texto", "filas"],
          additionalProperties: false,
        },
      },
      lineas: {
        type: "array",
        items: {
          type: "object",
          properties: {
            textoOriginal: {
              type: "string",
              description:
                "Cómo el cliente nombró el producto, tal cual, sin traducir.",
            },
            productoCatalogo: {
              type: ["string", "null"],
              description:
                "SOLO si hay UNA coincidencia inequívoca: la clave EXACTA de la lista de catálogo inyectada (copia carácter por carácter, ej. 'AGUACATE EXTRA HASS (115001005)'). null si: (a) ninguna clave encaja, (b) hay 2+ claves parecidas (misma fruta/verdura con distinta talla, calibre, grado, presentación o SKU) y el documento no distingue cuál, o (c) solo hay parecido parcial. Nunca inventes ni reformatees claves. Si dejas null, el usuario verá sugerencias cercanas y podrá elegir, cambiar o borrar la línea.",
            },
            cantidad: {
              type: ["number", "null"],
              description:
                "SOLO si el mensaje da un número de cantidad TOTAL explícito y directo (ej. '40 kilos'). Si el mensaje solo da cajas y una presentación (ej. '15 cajas de 1.5 kg') y no dice el total, deja null — NO lo calcules tú, eso lo hace el backend con código, no tú.",
            },
            unidad: {
              type: ["string", "null"],
              enum: [...UNIDADES, null],
              description:
                "Unidad mencionada: KGM (kilos), CJ (cajas como unidad de conteo, sin peso), UN (piezas/unidades sueltas). null si no se menciona explícitamente. Nunca devuelvas un valor fuera de esta lista (ej. nunca 'kilos' o 'kg' como texto — siempre el código KGM).",
            },
            cajas: {
              type: ["number", "null"],
              description:
                "Número de cajas si el mensaje lo menciona explícitamente. null si no.",
            },
            presentacion: {
              type: ["string", "null"],
              description:
                "La presentación EXACTA (de la lista de presentaciones disponibles) si el mensaje la menciona explícitamente (ej. 'cajas de 20 kg' → 'Caja 20 kg'). null si no se menciona — no asumas la presentación habitual del cliente.",
            },
            especificacion: {
              type: ["string", "null"],
              description:
                "Nota/calidad/madurez/uso o empaque de ESTE producto. PRIORIDAD (REQ-158): si la fila trae columna Madurez, Maduración, Firmeza o Nivel, cópiala aquí en TODAS las filas que la traigan, no solo en algunas. Vale el texto de la celda (pintón, maduro, enrriados, 3/4, listo para hoy). No la dejes solo en notas generales. También: 'sin penacho', '2x galón de 5 litros', '1x cubeta de 10 litros'. null si esa fila no trae nota.",
            },
            numeroPedido: {
              type: ["string", "null"],
              description:
                "Número/código de pedido del hotel para ESTE renglón (PO line order, Numero pedido, Order No. distinto por destino). Si el documento trae varios pedidos (387529 Banquetes, 387531 Cocina, etc.), cada línea lleva el suyo. null si no hay.",
            },
            almacen: {
              type: ["string", "null"],
              description:
                "Almacén / cocina / centro de consumo de ESTE renglón (columna Almacén / Centro de consumo / Centro de costo). Copia el texto COMPLETO: código + nombre (ej. 'ABAN Banquetes Ali', 'ACOE ComedorEmplea', 'BAWH Bar Whisky', 'COPM Coc Plaza Mx'). NUNCA omitas ni acortes el código de 3–6 letras aunque la celda del PDF se vea cortada. NO uses el almacén genérico del encabezado si la fila trae el suyo. null solo si la fila no indica destino.",
            },
            numeroAlmacen: {
              type: ["string", "null"],
              description:
                "Código numérico del almacén si viene (ej. '001'). null si no.",
            },
            referenciaPedido: {
              type: ["string", "null"],
              description:
                "Texto de referencia del pedido/renglón (ej. 'FYV BANQUETES PARA ENTREGA 29/09/2026…'). null si no.",
            },
            codigoProductoCliente: {
              type: ["string", "null"],
              description:
                "SKU/código del producto según el cliente (ej. '00000889'). null si no.",
            },
            responsableExterno: {
              type: ["string", "null"],
              description:
                "Nombre del responsable externo/contacto del pedido si aparece por renglón. null si no.",
            },
            precioUnitario: {
              type: ["number", "null"],
              description:
                "Precio unitario de ESTE renglón tomado de la columna Precio / P.U. / Precio unitario del documento (número, sin símbolo de moneda ni comas de miles). Ej. 33.00 o 188.00. null si la fila no trae precio.",
            },
          },
          required: [
            "textoOriginal",
            "productoCatalogo",
            "cantidad",
            "unidad",
            "cajas",
            "presentacion",
            "especificacion",
            "numeroPedido",
            "almacen",
            "numeroAlmacen",
            "referenciaPedido",
            "codigoProductoCliente",
            "responsableExterno",
            "precioUnitario",
          ],
          additionalProperties: false,
        },
      },
    },
    required: [
      "fechaEntregaTexto",
      "centroConsumo",
      "observaciones",
      "notasGeneralesAlmacen",
      "ordenCompraHotel",
      "nombreCliente",
      "rfc",
      "regimen",
      "direccion",
      "anden",
      "contacto",
      "telefono",
      "correo",
      "horarioDesde",
      "horarioHasta",
      "tolerancia",
      "sustituciones",
      "lote",
      "temperatura",
      "advertencia",
      "cuerpoMensaje",
      "lineas",
    ],
    additionalProperties: false,
  },
} as const;

function buildCatalogoContext(catalogoClaves: string[]): string {
  return catalogoClaves.map((clave) => `- "${clave}"`).join("\n");
}

function buildPresentacionesContext(presentaciones: string[]): string {
  return presentaciones
    .filter((p): p is string => Boolean(p))
    .map((p) => `- "${p}"`)
    .join("\n");
}

function buildUserContent({
  texto,
  archivosTexto,
  archivosImagen,
}: {
  texto: string;
  archivosTexto: ArchivoTexto[];
  archivosImagen: ArchivoImagen[];
}): ChatCompletionContentPart[] {
  const partes: ChatCompletionContentPart[] = [];

  let bloqueTexto = `Mensaje del pedido (tal cual lo pegó el vendedor):\n"""\n${texto || "(sin texto)"}\n"""`;

  if (archivosTexto.length > 0) {
    bloqueTexto += "\n\nContenido extraído de archivos adjuntos:\n";
    bloqueTexto += archivosTexto
      .map((f) => `--- ${f.nombre} ---\n${f.contenido}`)
      .join("\n\n");
  }

  partes.push({ type: "text", text: bloqueTexto });

  for (const img of archivosImagen) {
    partes.push({
      type: "image_url",
      image_url: { url: `data:${img.mime};base64,${img.base64}` },
    });
  }

  return partes;
}

function normalizeCuerpoMensaje(raw: unknown): CuerpoMensajeBloque[] {
  if (!Array.isArray(raw)) return [];
  const bloques: CuerpoMensajeBloque[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const tipo = (item as { tipo?: unknown }).tipo;
    const texto = (item as { texto?: unknown }).texto;
    const filas = (item as { filas?: unknown }).filas;
    if (tipo === "tabla" && Array.isArray(filas)) {
      const rows = filas
        .filter((row): row is unknown[] => Array.isArray(row))
        .map((row) => row.map((cell) => String(cell ?? "").trim()));
      if (rows.length > 0) {
        bloques.push({ tipo: "tabla", texto: null, filas: rows });
      }
      continue;
    }
    if (tipo === "texto" && typeof texto === "string" && texto.trim()) {
      bloques.push({ tipo: "texto", texto: texto.trim(), filas: null });
    }
  }
  return bloques;
}

export function formatISO(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function sumarDias(referencia: Date, dias: number): string {
  const d = new Date(referencia);
  d.setUTCDate(d.getUTCDate() + dias);
  return formatISO(d);
}

const SIN_ACENTOS: Record<string, string> = {
  á: "a",
  é: "e",
  í: "i",
  ó: "o",
  ú: "u",
  ñ: "n",
};
function quitarAcentos(s: string): string {
  return s.toLowerCase().replace(/[áéíóúñ]/g, (c) => SIN_ACENTOS[c] ?? c);
}

const DIAS_SEMANA: Record<string, number> = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
};

// AUDITORÍA 2026-09-03 · Hallazgo #6 (Alto) — chrono-node (usado en resolverFechaEntrega
// más abajo) falla en 3 patrones de fecha compuesta en español, confirmados en la
// auditoría real: "pasado mañana"/"pasado manana" (sin acento no resuelve nada; con
// acento resuelve mal, -1 día), "en N días" (no resuelve, da null), y "[día] de la
// próxima/otra semana" cuando ese día coincide con el día de hoy (resuelve a HOY en vez
// de a la semana siguiente). Fix: normalizador determinista propio que intercepta estos
// 3 patrones ANTES de pasarle el texto a chrono-node — sigue siendo 100% código, sin IA
// de por medio (ver principio general del archivo). Si ninguno de los 3 patrones aplica,
// se sigue delegando en chrono-node como antes.
export function normalizarFechaConocida(
  fraseOriginal: string,
  referencia: Date,
): string | null {
  const frase = quitarAcentos(fraseOriginal.trim());

  if (/^pasado\s+manana\b/.test(frase)) {
    return sumarDias(referencia, 2);
  }

  const enDias = frase.match(/^en\s+(\d+)\s+dias?\b/);
  if (enDias) {
    return sumarDias(referencia, Number(enDias[1]));
  }

  const proximaSemana = frase.match(
    /\b(domingo|lunes|martes|miercoles|jueves|viernes|sabado)\s+de\s+la\s+(?:(proxima|otra|entrante)\s+semana|semana\s+(?:que\s+entra|siguiente|entrante))\b/,
  );
  if (proximaSemana) {
    const diaObjetivo = DIAS_SEMANA[proximaSemana[1]];
    const diaHoy = referencia.getUTCDay();
    // Calcula el domingo que abre la semana calendario ACTUAL, le suma 7 días para
    // llegar al domingo de la semana SIGUIENTE, y de ahí cuenta hasta el día objetivo.
    // (Una primera versión de este cálculo hacía "días hasta la próxima ocurrencia + 7",
    // que fallaba cuando el día objetivo ya había pasado esta semana: para el día ya
    // pasado, "la próxima ocurrencia" ya caía en la semana siguiente, y sumarle 7 de
    // más saltaba dos semanas en vez de una — lo atrapó la prueba unitaria de este día
    // ya pasado, "martes" con hoy=jueves.)
    const inicioSemanaSiguiente = sumarDias(referencia, 7 - diaHoy);
    return sumarDias(
      new Date(`${inicioSemanaSiguiente}T12:00:00Z`),
      diaObjetivo,
    );
  }

  return null;
}

/**
 * Resuelve una frase de fecha en español ("mañana", "el jueves", "15 de septiembre") a
 * una fecha ISO YYYY-MM-DD, anclada a hoyISO. Primero intenta los patrones conocidos que
 * chrono-node resuelve mal (normalizarFechaConocida); si ninguno aplica, usa chrono-node
 * (parser determinista de fechas en lenguaje natural) — en ambos casos, sin pedirle a la
 * IA que haga la aritmética.
 */
export function resolverFechaEntrega(
  fraseTexto: string | null,
  hoyISO: string,
): string | null {
  if (!fraseTexto) return null;
  const referencia = new Date(`${hoyISO}T12:00:00Z`);

  const conocida = normalizarFechaConocida(fraseTexto, referencia);
  if (conocida) return conocida;

  const resultado = chrono.es.parseDate(fraseTexto, referencia, {
    forwardDate: true,
  });
  return resultado ? formatISO(resultado) : null;
}


/** Valida/coacciona la clave de Mateo contra el catálogo real. */
function coerceProductoCatalogo(
  value: string | null | undefined,
  catalogoClaves: readonly string[],
): string | null {
  if (!value?.trim() || catalogoClaves.length === 0) return null;
  const raw = value.trim();
  if (catalogoClaves.includes(raw)) return raw;

  const normalize = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .replace(/\s+/g, " ");

  const rawNorm = normalize(raw);
  const byNorm = catalogoClaves.find((k) => normalize(k) === rawNorm);
  if (byNorm) return byNorm;

  const codigoMatch = raw.match(/\(([^()]+)\)\s*$/);
  const codigo = codigoMatch?.[1]?.trim().toLowerCase();
  if (codigo) {
    const hits = catalogoClaves.filter((k) => {
      const m = k.match(/\(([^()]+)\)\s*$/);
      return m?.[1]?.trim().toLowerCase() === codigo;
    });
    if (hits.length === 1) return hits[0] ?? null;
  }

  return null;
}

export async function extraerPedido({
  texto,
  archivosExtraidos,
  hoyISO,
  catalogoClaves,
  presentaciones,
}: ExtraerPedidoInput): Promise<ResultadoExtraccion> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Falta OPENAI_API_KEY en el entorno del servidor.");
  }

  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const archivosTexto = archivosExtraidos.filter(
    (f): f is ArchivoTexto => f.tipo === "texto",
  );
  const archivosImagen = archivosExtraidos.filter(
    (f): f is ArchivoImagen => f.tipo === "imagen",
  );
  const archivosNoLegibles = archivosExtraidos
    .filter((f) => f.tipo === "no_legible")
    .map((f) => f.nombre);

  const systemPrompt = [
    `Eres un asistente que lee pedidos de fruta y verdura escritos por vendedores para hoteles y extrae datos estructurados.`,
    `Catálogo de productos disponible (usa la clave EXACTA solo con coincidencia inequívoca; si hay duda o varias parecidas → null — el usuario verá sugerencias y elegirá):`,
    buildCatalogoContext(catalogoClaves),
    `Presentaciones disponibles (usa el texto EXACTO solo si el mensaje la menciona explícitamente):`,
    buildPresentacionesContext(presentaciones),
    `Reglas importantes:`,
    `- Tu trabajo es solo interpretar lenguaje: identificar qué dice el texto y a qué se refiere. NUNCA hagas cuentas (sumar, multiplicar, calcular una fecha) — eso lo hace el backend con código después de que tú extraigas los datos en crudo.`,
    `- Completa TODOS los campos del schema cuando el mensaje/archivos los mencionen de forma explícita o inequívoca (fecha, centro, orden de compra/PO, nombre del cliente/hotel, dirección, andén, contacto, teléfono, ventanas/horarios, políticas, observaciones y cada línea). No dejes null un dato que sí aparece.`,
    `- Solo extrae lo que el mensaje/archivos realmente dicen. No inventes cantidades, presentaciones, fechas, direcciones ni contactos que no estén respaldados.`,
    `- "nombreCliente" vs "centroConsumo" (crítico — no mezclar): nombreCliente = denominación comercial / razón social / hotel / propiedad / Bill To. centroConsumo = SOLO área interna (cocina, bar, banquete, almacén de fila, centro de costo). NUNCA copies el nombre del resort/hotel en centroConsumo. Si solo aparece el hotel sin cocina/área → centroConsumo null. El RFC va en "rfc", nunca en centro ni como nombre.`,
    `- "nombreCliente": denominación / hotel / comprador si aparece (Customer, Bill To, Hotel, Property, Cliente, etc.). No uses el PO ni el RFC como nombre. null solo si no hay ningún nombre.`,
    `- Una línea por cada fila de producto del documento. Si hay VARIOS Numero pedido / PO, o el MISMO PO con DISTINTOS Almacén / centro de consumo (ej. BAWH Bar Whisky vs COPM Coc Plaza Mx), emite una línea por cada producto×destino con numeroPedido y almacen de ESA fila. NO mezcles destinos ni pedidos en una sola línea. NO omitas filas de páginas intermedias.`,
    `- "numeroPedido" + "almacen" separan órdenes de trabajo: mismo PO + distinto almacén = otra hija; distinto PO = otra hija aunque el almacén coincida.`,
    `- "almacen" / "centroConsumo" (crítico — no acortar): copia SIEMPRE código + nombre completos de la columna (ej. 'ABAN Banquetes Ali', no solo 'Banquetes Ali'; 'ACOE ComedorEmplea', no solo 'Comedor…'). El código de 3–6 letras identifica la cocina del cliente; perderlo rompe el surtido. Aunque el PDF trunque visualmente la celda, conserva todo el texto legible del código y del nombre.`,
    `- "precioUnitario": si el documento trae columna Precio / P.U. / Importe unitario por fila, cópialo en cada línea (número). No uses el total/importe de la fila; solo el precio unitario.`,
    `- Matching de "productoCatalogo" (crítico):`,
    `  1) Copia la clave EXACTA de la lista (mismo texto entre comillas, con paréntesis y SKU). Nunca inventes, acortes ni reformatees.`,
    `  2) Asigna clave SOLO si es inequívoca: mismo producto (nombre/sinónimo claro) Y misma variante (talla, calibre, grado, presentación, color). Ej. "chile jalapeño 6-8 cm" ≠ "chile jalapeño 8-10 cm".`,
    `  3) Si en el catálogo hay 2+ claves parecidas y el documento no distingue (ej. solo dice "aguacate hass" y hay Extra/Primera/Segunda), deja productoCatalogo en null.`,
    `  4) Si el documento trae código/SKU del cliente ("codigoProductoCliente") y ese código coincide con el SKU entre paréntesis de UNA sola clave del catálogo, usa esa clave.`,
    `  5) Si no hay coincidencia clara → null. El usuario aceptará una sugerencia, elegirá otro del catálogo o borrará la línea. Mejor null que un producto equivocado.`,
    `  6) "textoOriginal" siempre es cómo el cliente nombró el producto, aunque productoCatalogo sea null.`,
    `- "cantidad" es el número TOTAL si viene explícito y directo (ej. '40 kilos'); si el mensaje solo da cajas + presentación sin decir el total, deja "cantidad" en null.`,
    `- Envases con contenido (ej. '1 galón de 5 litros', '2 cubetas de 10 L', '3 cajas de 20 kg'): en "cantidad" pon el NÚMERO DE ENVASES (1, 2, 3), en "unidad" UN (o CJ si dice cajas), y deja el contenido en textoOriginal. NO pongas los litros/kg totales en cantidad — eso lo convierte el backend según la unidad del catálogo. "precioUnitario" es el precio POR ENVASE del documento, no por litro/kg.`,
    `- "observaciones" es del pedido completo, no repitas ahí lo que ya va en una línea.`,
    `- "notasGeneralesAlmacen": 1-2 frases o viñetas cortas con especificaciones de almacén (máx. 160 caracteres). Nunca el cuerpo completo del correo. NUNCA conclusiones/inconsistencias inventadas.`,
    `- IMPORTANTE — notas del cliente: si el PDF/correo tiene un bloque «Observaciones del cliente», «Observaciones», «Notas del cliente», «Comentarios del cliente», «Indicaciones», «Instrucciones» o viñetas bajo esos títulos (ej. «la piña que no esté muy madura», «aguacate NO muy maduro / enrriados»), DEBES volcarlas en notasGeneralesAlmacen (y/o observaciones). Esas notas son prioritarias frente a textos genéricos de vigencia, madurez del catálogo o horario de recepción. NUNCA uses notas para conclusiones tipo «el correo dice X pero el PDF dice Y».`,
    `- AGUACATE (catálogo): si solo dice AGUACATE / AGUACATE HASS / HASS (sin EXTRA) → AGUACATE PRIMERA (170 a 200g) SKU 115001009. Si menciona EXTRA → AGUACATE EXTRA (200 a 260g) SKU 115001005.`,
    `- "ordenCompraHotel": interpreta cuál es el identificador de la orden de compra del hotel/cliente. El nombre del campo en el documento VARÍA (PO NUMBER, PO #, Purchase Order, Orden de compra, OC, Nº OC, Order No., Customer PO, REQUISICION #, R.C., Req #, etc.). Devuelve solo el código/número (ej. CUNMC0046026 o 50184 si dice REQUISICION # 50184). En XPU HA usa el número de 'REQUISICION #' (ej. 50179), NUNCA el Artículo/SKU (00001678) ni el título "Requisición de Compra". NO confundas con Customer Account #, fechas, 'Autoriza'/'Autorizado'/'rAutorizado'/'Solicita'. null solo si no hay ningún identificador de OC/PO/requisición.`,
    `- "rfc" solo si el mensaje/documento lo declara explícitamente; nunca lo infieras del nombre del cliente.`,
    `- "direccion", "anden", "contacto", "telefono", "correo", "horarioDesde" y "horarioHasta" salen del correo, mensaje o PDF (Ship To, Deliver To, Enviar a, Andén, Dock, Contacto, Tel, Email, hora de entrega, ventana de recepción, delivery window). Llénalos siempre que el dato aparezca; null solo si no está. No inventes ni uses un valor habitual que el documento no diga.`,
    `- "correo" (REQ-122): usa mail humano del hotel. Si De/From es bss_system@birchstreet.net, noreply o cuenta del proveedor (admonaguacatesdepuebla), busca Email/mailto en el cuerpo/PDF. Si De/From es persona del hotel, úsalo. No pongas el Para/To del proveedor.`,
    `- "especificacion" (REQ-158): en correos de Pedidos · Aguacates de Puebla, cada renglón puede traer su nivel de maduración en una columna. Cópialo en la especificación de ESA fila, en todas las filas que tengan valor, aunque el nombre del producto no diga verde/firme/maduro. No lo dejes solo en las notas generales.`,
    `- "nombreCliente" (REQ-116): en POs BirchStreet (bss_system) copia Property/Hotel/Bill To (ej. FAIRMONT MAYAKOBA), no el remitente ni la cocina.`,
    `- "horarioDesde"/"horarioHasta" (crítico): si el cuerpo dice "Hora de entrega 6:00 am", "8:00 AM – 2:00 PM", "de 8 a 14", "ventana de recepción…", DEBES llenarlos en 24h HH:MM. No los dejes null si aparecen. Una sola hora → solo horarioDesde.`,
    `- "regimen", "tolerancia", "sustituciones", "lote" y "temperatura": llénalos solo si el documento los declara. Si no aparecen, null.`,
    `- "unidad" siempre debe ser exactamente KGM, CJ o UN (o null) — nunca un texto libre como "kilos" o "kg".`,
    `- "centroConsumo" debe quedar null si el mensaje expresa incertidumbre sobre cuál es, incluso si menciona un valor tentativo de pasada. También null si lo único que hay es el nombre del hotel/denominación (eso es nombreCliente).`,
    `- "fechaEntregaTexto" (crítico): copia la frase EXACTA de ENTREGA del pedido (ej. "Entrega: viernes, 23 de octubre de 2026", "21/10/2026", "Delivery date: 10/24/2026"). NUNCA uses la fecha Enviado/Sent/Received del correo ni la del hilo. NUNCA asumas "mañana"/"hoy" si hay fecha concreta de entrega. null SOLO si de verdad no hay pista de entrega.`,
    `- Si el texto y los archivos, en conjunto, NO describen un pedido de fruta/verdura (ej. son spam, un documento administrativo sin relación, contenido vacío o ilegible), deja "lineas" vacío y usa "advertencia" para explicarlo — no inventes líneas solo para llenar algo.`,
    `- "cuerpoMensaje": reconstruye el cuerpo del correo para lectura. Si hay tabla de productos, un bloque tipo=tabla con encabezados y UNA fila por renglón (celdas completas, sin cortes). El resto (saludo, hora de entrega, cierre, firma) va en bloques tipo=texto. No copies la tabla otra vez como prosa. No inventes datos.`,
  ].join("\n");

  // AUDITORÍA 2026-09-03 · Hallazgo #5 (Alto) — sin temperature/seed fijado, el mismo
  // input ambiguo producía salidas distintas entre llamadas (en una prueba real, 1 de 3
  // corridas del mismo archivo inventó una cantidad que la fuente no respaldaba).
  // Fix: temperature:0 minimiza (no elimina del todo — el muestreo de un LLM nunca es
  // 100% determinista incluso en temperature:0) esa variabilidad. PERO: algunos modelos
  // (confirmado en vivo con el configurado en este entorno, un modelo estilo razonamiento)
  // rechazan cualquier valor de temperature distinto del default con un 400
  // ("Unsupported value: 'temperature' does not support 0 with this model"). No hay forma
  // de saberlo de antemano por el nombre del modelo, así que se detecta al vuelo: se
  // intenta con temperature:0, y si el modelo configurado la rechaza específicamente, se
  // reintenta sin ella y se recuerda para no volver a pagar el intento fallido en cada
  // llamada futura de este mismo proceso. Al portar a WMS: aplicar el mismo patrón
  // "probar y degradar con gracia" si se permite elegir modelo libremente.
  // Hallazgo #10 (Medio) — sin retry/backoff explícito; el SDK ya trae maxRetries:2 por
  // defecto para errores retryable (429/5xx), pero quedaba implícito. Se fija explícito
  // para que quede autodocumentado en vez de depender de un default que puede cambiar
  // entre versiones del SDK.
  const messages = [
    { role: "system" as const, content: systemPrompt },
    {
      role: "user" as const,
      content: buildUserContent({ texto, archivosTexto, archivosImagen }),
    },
  ];

  const usaTemperatura = !MODELOS_SIN_TEMPERATURA.has(model);
  let completion;
  try {
    completion = await client.chat.completions.create(
      {
        model,
        ...(usaTemperatura ? { temperature: 0 } : {}),
        messages,
        response_format: { type: "json_schema", json_schema: RESPONSE_SCHEMA },
      },
      { maxRetries: 2 },
    );
  } catch (err) {
    if (
      usaTemperatura &&
      err instanceof OpenAI.APIError &&
      err.param === "temperature"
    ) {
      MODELOS_SIN_TEMPERATURA.add(model);
      completion = await client.chat.completions.create(
        {
          model,
          messages,
          response_format: {
            type: "json_schema",
            json_schema: RESPONSE_SCHEMA,
          },
        },
        { maxRetries: 2 },
      );
    } else {
      throw err;
    }
  }

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("OpenAI no devolvió contenido.");
  }

  const parsed = JSON.parse(raw) as PedidoExtraidoRaw;

  // Fallback determinista + enriquecimiento de códigos de almacén desde el PDF/correo.
  const sourceForEntrega = [
    texto,
    ...archivosTexto.map((f) => `--- ${f.nombre} ---\n${f.contenido}`),
  ].join("\n");

  // Post-proceso: Oc Generada / REQUISICION # vs basura OCR (rAutorizado, Usuario…).
  const lineasRaw = parsed.lineas.map((l) => ({
    textoOriginal: l.textoOriginal,
    productoCatalogo: coerceProductoCatalogo(l.productoCatalogo, catalogoClaves),
    // El cálculo determinista manda siempre que sea posible (cajas + presentación con
    // peso parseable); el número que haya dado la IA solo se usa cuando no hay nada
    // que calcular — así el resultado no depende de si el modelo decidió o no hacer
    // la multiplicación por su cuenta.
    cantidad: calcularCantidadDesdeCajas(l.cajas, l.presentacion) ?? l.cantidad,
    unidad: l.unidad,
    cajas: l.cajas,
    presentacion: l.presentacion,
    especificacion: l.especificacion,
    numeroPedido: l.numeroPedido?.trim() || null,
    almacen: l.almacen?.trim() || null,
    numeroAlmacen: l.numeroAlmacen?.trim() || null,
    referenciaPedido: l.referenciaPedido?.trim() || null,
    codigoProductoCliente: l.codigoProductoCliente?.trim() || null,
    responsableExterno: l.responsableExterno?.trim() || null,
    precioUnitario:
      l.precioUnitario != null &&
      Number.isFinite(l.precioUnitario) &&
      l.precioUnitario > 0
        ? l.precioUnitario
        : null,
  }));
  const normalizedPedidos = normalizeNumeroPedidoFields({
    ordenCompraHotel: parsed.ordenCompraHotel?.trim() || null,
    lineas: lineasRaw,
    sourceText: sourceForEntrega,
    fileNames: archivosExtraidos.map((f) => f.nombre),
  });
  const ordenCompraHotelNormalizado = normalizedPedidos.ordenCompraHotel;

  const lineas: LineaExtraida[] = aplicarMadurezDesdeTexto(
    enrichLineasAlmacenConCodigoDesdeTexto(
      normalizedPedidos.lineas,
      sourceForEntrega,
    ),
    sourceForEntrega,
  );

  const entregaBody = extractEntregaDesdeTexto(sourceForEntrega, hoyISO);
  const fechaDesdeIa = resolverFechaEntrega(parsed.fechaEntregaTexto, hoyISO);
  // REQ-119: línea Entrega:/Delivery date del cuerpo manda sobre Mateo (evita Enviado/hoy).
  const fechaBody =
    entregaBody.fechaIso ||
    resolverFechaEntrega(entregaBody.fechaFrase, hoyISO);
  const fechaEntrega = fechaBody || fechaDesdeIa;
  const horarioDesde =
    parsed.horarioDesde?.trim() || entregaBody.horarioDesde || null;
  const horarioHasta =
    parsed.horarioHasta?.trim() || entregaBody.horarioHasta || null;

  const fechaLabel =
    parsed.fechaEntregaTexto?.trim() ||
    entregaBody.fechaFrase ||
    fechaEntrega ||
    null;
  const nombreClienteCabecera =
    (typeof parsed.nombreCliente === "string"
      ? parsed.nombreCliente.trim()
      : "") || "";
  // Ship To del documento manda sobre Bill To / lo que Mateo haya puesto.
  const direccionCabecera =
    extractDireccionShipToDesdeTexto(sourceForEntrega) ||
    parsed.direccion?.trim() ||
    "";
  const andenCabecera = parsed.anden?.trim() || "";
  const contactoCabecera = parsed.contacto?.trim() || "";
  const telefonoCabecera = sanitizeTelefonoContacto(parsed.telefono);
  const correoIa = parsed.correo?.trim() || "";
  const correoDesdeTexto =
    extractCorreoContactoDesdeTexto(sourceForEntrega) || "";
  // REQ-122: no quedarse con From genérico si el cuerpo trae mail humano.
  const correoCabecera =
    (correoIa && !isCorreoRemitenteGenerico(correoIa)
      ? correoIa
      : correoDesdeTexto || correoIa) || "";
  const ventanaDesdeCabecera = horarioDesde || "";
  const ventanaHastaCabecera = horarioHasta || "";
  const notasCabecera =
    parsed.notasGeneralesAlmacen?.trim() ||
    parsed.observaciones?.trim() ||
    "";
  const origenCorreo = lineas.map((l, index) => ({
    // ISO primero: al reabrir OV, parseFechaOrigen no debe romper MM/DD BirchStreet.
    Fecha: fechaEntrega || fechaLabel || "",
    Unidad: l.unidad === "KGM" ? "KGS" : l.unidad || "",
    Almacen: l.almacen || parsed.centroConsumo || "",
    Horario: "",
    Cantidad: l.cantidad ?? 0,
    Producto: l.textoOriginal || l.productoCatalogo || "",
    Precio:
      l.precioUnitario != null &&
      Number.isFinite(l.precioUnitario) &&
      l.precioUnitario > 0
        ? l.precioUnitario
        : "",
    "Numero correo": "",
    "Numero pedido": l.numeroPedido || ordenCompraHotelNormalizado || "",
    "Nombre cliente": nombreClienteCabecera,
    "Numero almacen": l.numeroAlmacen || "",
    "Codigo producto": l.codigoProductoCliente || "",
    "Referencia pedido": l.referenciaPedido || "",
    "Responsable externo": l.responsableExterno || contactoCabecera || "",
    "Responsable interno": "",
    "Referencia del cliente": "",
    "Ventana desde": ventanaDesdeCabecera,
    "Ventana hasta": ventanaHastaCabecera,
    Destino: direccionCabecera,
    "Direccion entrega": direccionCabecera,
    Anden: andenCabecera,
    "Telefono contacto": telefonoCabecera,
    "Correo contacto": correoCabecera,
    Prioridad: "",
    "Notas generales": notasCabecera,
    _lineaIndex: index,
  }));

  // Base para el hallazgo "sin logging de costo" (dominio Integraciones) y el hallazgo
  // #2 (Alto, "sin límite de gasto") — decisión del Responsable: solo loguear el gasto
  // estimado, nunca bloquear una solicitud por costo. El log en sí vive en la ruta
  // que invoque este servicio; aquí solo se expone el dato.
  const uso: UsoOpenAI | null = completion.usage
    ? (() => {
        const tokensCacheados =
          completion.usage?.prompt_tokens_details?.cached_tokens ?? 0;
        const tokensCacheEscritura =
          (
            completion.usage?.prompt_tokens_details as
              | { cache_write_tokens?: number }
              | undefined
          )?.cache_write_tokens ?? 0;
        return {
          tokensEntrada: completion.usage.prompt_tokens,
          tokensEntradaCacheados: tokensCacheados,
          tokensEntradaCacheEscritura: tokensCacheEscritura,
          tokensSalida: completion.usage.completion_tokens,
          tokensTotal: completion.usage.total_tokens,
          costoUSD: calcularCostoUSD(
            model,
            completion.usage.prompt_tokens,
            tokensCacheados,
            tokensCacheEscritura,
            completion.usage.completion_tokens,
          ),
        };
      })()
    : null;

  const nombreCliente = parsed.nombreCliente?.trim() || null;
  const centroDesdeLineas =
    lineas.find((l) => l.almacen?.trim())?.almacen?.trim() || null;
  const pedido: PedidoExtraido = {
    fechaEntrega,
    centroConsumo: resolveCentroConsumoSinConfundirConCliente(
      enrichAlmacenConCodigoDesdeTexto(
        parsed.centroConsumo || centroDesdeLineas,
        sourceForEntrega,
      ),
      nombreCliente,
    ),
    observaciones: parsed.observaciones,
    notasGeneralesAlmacen: parsed.notasGeneralesAlmacen?.trim() || null,
    ordenCompraHotel: ordenCompraHotelNormalizado,
    nombreCliente,
    rfc: parsed.rfc,
    regimen: parsed.regimen,
    direccion: direccionCabecera || null,
    anden: parsed.anden,
    contacto: parsed.contacto,
    telefono: telefonoCabecera || null,
    correo: correoCabecera || null,
    horarioDesde,
    horarioHasta,
    tolerancia: parsed.tolerancia,
    sustituciones: parsed.sustituciones,
    lote: parsed.lote,
    temperatura: parsed.temperatura,
    lineas,
    origenCorreo,
    advertencia: parsed.advertencia,
    archivosNoLegibles,
    textoOrigen: serializeCuerpoMensaje(normalizeCuerpoMensaje(parsed.cuerpoMensaje)) || null,
  };

  return { pedido, uso };
}
