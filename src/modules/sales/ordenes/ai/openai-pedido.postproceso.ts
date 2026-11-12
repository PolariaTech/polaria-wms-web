import type { ArchivoExtraido, ArchivoTexto } from "./file-extractors";
import { calcularCantidadDesdeCajas } from "../utils/pedido/empaque-lineas";
import {
  extractCorreoContactoDesdeTexto,
  isCorreoRemitenteGenerico,
} from "../utils/origen/correo-chrome";
import {
  extractDireccionShipToDesdeTexto,
  extractEntregaDesdeTexto,
  quitarContactoDeDireccion,
} from "../utils/pedido/extract-entrega-desde-texto";
import { sanitizeTelefonoContacto } from "../utils/pedido/sanitize-telefono-contacto";
import { resolveCentroConsumoSinConfundirConCliente } from "../utils/pedido/centro-consumo-vs-cliente";
import {
  enrichAlmacenConCodigoDesdeTexto,
  enrichLineasAlmacenConCodigoDesdeTexto,
} from "../utils/pedido/enrich-almacen-codigo";
import { aplicarMadurezDesdeTexto } from "../utils/pedido/madurez-linea";
import { aplicarPiezasAproxKg } from "../utils/pedido/piezas-aprox-kg";
import { normalizeNumeroPedidoFields } from "../utils/pedido/normalize-numero-pedido";
import {
  serializeCuerpoMensaje,
  type CuerpoMensajeBloque,
} from "../utils/origen/texto-origen-pedido";
import { filtrarLineasExtraidasPedibles } from "../utils/origen/renglon-origen-pedible";
import {
  extractTotalSolicitudFromTextos,
  textosDesdeArchivosExtraidos,
} from "../utils/pedido/total-solicitud-vs-ov";
import { resolverFechaEntrega } from "./fechas-pedido";
import type {
  LineaExtraida,
  PedidoExtraido,
  PedidoExtraidoRaw,
} from "./openai-pedido.tipos";

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

/** Valida/coacciona la clave de Mateo contra el catálogo real. */
function coerceProductoCatalogo(
  value: string | null | undefined,
  catalogoClaves: readonly string[],
): string | null {
  if (!value?.trim() || catalogoClaves.length === 0) return null;
  const raw = value.trim();
  if (catalogoClaves.includes(raw)) return raw;

  const normalize = (texto: string) =>
    texto
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
    const hits = catalogoClaves.filter((clave) => {
      const matchCodigo = clave.match(/\(([^()]+)\)\s*$/);
      return matchCodigo?.[1]?.trim().toLowerCase() === codigo;
    });
    if (hits.length === 1) return hits[0] ?? null;
  }

  return null;
}

export function postprocesarPedido(params: {
  raw: string;
  texto: string;
  archivosExtraidos: ArchivoExtraido[];
  archivosTexto: ArchivoTexto[];
  hoyISO: string;
  catalogoClaves: string[];
  archivosNoLegibles: string[];
}): PedidoExtraido {
  const {
    raw,
    texto,
    archivosExtraidos,
    archivosTexto,
    hoyISO,
    catalogoClaves,
    archivosNoLegibles,
  } = params;
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

  // REQ-234: excluir SKUs con cantidad <= 0 antes de armar origen_correo.
  const lineas: LineaExtraida[] = aplicarPiezasAproxKg(
    aplicarMadurezDesdeTexto(
      enrichLineasAlmacenConCodigoDesdeTexto(
        filtrarLineasExtraidasPedibles(normalizedPedidos.lineas),
        sourceForEntrega,
      ),
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
    quitarContactoDeDireccion(parsed.direccion) ||
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


  const nombreCliente = parsed.nombreCliente?.trim() || null;
  const centroDesdeLineas =
    lineas.find((l) => l.almacen?.trim())?.almacen?.trim() || null;
  const textoOrigen =
    serializeCuerpoMensaje(normalizeCuerpoMensaje(parsed.cuerpoMensaje)) ||
    null;
  // REQ-279: total en cuerpo o en textos ya extraídos de adjuntos (PDF/EML).
  const totalSolicitud = extractTotalSolicitudFromTextos([
    texto,
    textoOrigen,
    ...textosDesdeArchivosExtraidos(archivosExtraidos),
  ]);

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
    textoOrigen,
    totalSolicitud,
  };

  return pedido;
}
