import type { PedidoExtraido } from "../ai/openai-pedido.client";
import { sanitizeTelefonoContacto } from "./sanitize-telefono-contacto";
import type { ProductoVentaOption } from "../../shared/types/sales.types";
import { stripLeadingProductoCodigo } from "../../shared/utils/producto-venta-nombre";
import { formatCapturaFecha } from "./build-orden-venta-captura-observaciones";
import {
  aplicarEmpaqueInicialLinea,
  collectMissingFieldsDocs,
  type CampoOperativoDocs,
} from "./empaque-lineas";
import {
  findTypoRivalProductos,
  productoCompatibleConTextoCliente,
  rankProductosCatalogo,
  scoreProductoMatch,
  shouldAutoAcceptProductoSuggestion,
} from "./find-closest-producto-catalogo";
import { groupKeyOrigenCorreo } from "./origen-correo-ordenes-trabajo";
import {
  extractDireccionShipToDesdeTexto,
  extractEntregaDesdeTexto,
} from "./extract-entrega-desde-texto";
import { parseFechaOrigen } from "./materialize-ov-desde-origen";
import {
  FECHA_ENTREGA_ATRASADA_WARNING,
  FECHA_ENTREGA_DEFAULT_WARNING,
  isFechaEntregaAtrasada,
} from "./pedido-form-validation";
import {
  familiaUnidadCatalogo,
  formatEspecificacionEnvase,
  resolveCantidadPrecioDesdeEnvase,
} from "./resolve-cantidad-envase";
import { sanitizeNotasGeneralesPedido } from "./texto-origen-pedido";

export interface SugerenciaProductoCatalogo {
  idProducto: string;
  nombre: string;
  codigo: string;
  idBodega: string;
  kgDisponible: number;
  unidadMedida: string;
  precioUnitario: number;
}

export interface LineaVentaFromIa {
  idProducto: string;
  nombre: string;
  codigo: string;
  idBodega: string;
  cantidadInput: string;
  cajasInput: string;
  presentacion: string;
  especificacion: string;
  descuentoPctInput: string;
  ivaPct: string;
  kgDisponible: number;
  unidadMedida: string;
  precioUnitario: number;
  /** true si el precio vino del documento (no del catálogo). */
  precioManual?: boolean;
  aliasCliente: string;
  filledByIa: boolean;
  /** Clave de orden de trabajo (pedido|almacén) para paginar el formulario. */
  otId: string;
  packHint?: string;
  autoPackFields?: Array<"cajasInput" | "presentacion" | "cantidadInput">;
  /**
   * Sin match confiable de catálogo: hay que aceptar sugerencia, elegir otro o borrar.
   */
  catalogPending?: boolean;
  /** Varios productos del catálogo se parecen: el usuario debe elegir. */
  catalogAmbiguo?: boolean;
  /** Producto más cercano del catálogo (sugerencia primaria de Mateo). */
  sugerencia?: SugerenciaProductoCatalogo | null;
  /** Otras coincidencias cercanas cuando hay ambigüedad o empate. */
  sugerenciasAlternativas?: SugerenciaProductoCatalogo[];
}

export interface CampoDiscrepancia {
  campo: string;
  /** Clave del campo del formulario para poder aplicar el reemplazo. */
  fieldKey: string;
  db: string;
  ia: string;
}

export interface PedidoIaFormPatch {
  fechaEntrega: string;
  centroConsumo: string;
  observaciones: string;
  ordenCompraHotel: string;
  direccion: string;
  anden: string;
  contacto: string;
  telefono: string;
  correo: string;
  ventanaDesde: string;
  ventanaHasta: string;
  aceptaSustituciones: string;
  requiereLote: string;
  registrarTemperatura: string;
  autoFields: Set<string>;
  warnFields: Set<string>;
  missingFields: Set<string>;
  discrepancias: CampoDiscrepancia[];
  lineas: LineaVentaFromIa[];
  advertencia: string | null;
  archivosNoLegibles: string[];
}

const PRESENTACION_SET = new Set([
  "",
  "Caja 1.5 kg",
  "Caja 20 kg",
  "Caja 21 kg",
  "Granel",
]);

function catalogKey(nombre: string, codigo: string): string {
  return `${nombre} (${codigo})`;
}

function norm(value: string | null | undefined): string {
  return (value ?? "").toString().trim().toLowerCase();
}

function normalizeCatalogKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ");
}

/** Código entre paréntesis: "NOMBRE (SKU)" o texto con Cód. (115001005). */
function extractCodigoFromCatalogKey(key: string): string | null {
  const trimmed = key.trim();
  const atEnd = trimmed.match(/\(([^()]+)\)\s*$/);
  if (atEnd?.[1]?.trim()) return atEnd[1].trim();
  // Cualquier (código alfanumérico) en el texto — típico en PDFs de cotización.
  const any = trimmed.match(/\(([A-Z0-9][A-Z0-9._-]{2,}|[0-9]{4,})\)/i);
  return any?.[1]?.trim() || null;
}

function parsePrecioIa(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value) || value <= 0) return null;
  return value;
}

/**
 * Cantidad/precio/empaque de una línea: si el texto trae "N envase de X unidad"
 * y el catálogo vende en esa familia, convierte; si no, empaque cajas/kg.
 */
function resolveLineaCantidadPrecioEmpaque(params: {
  textoOriginal: string;
  unidadMedidaCatalogo: string;
  cantidad: number | null | undefined;
  cajas: number | null | undefined;
  presentacion: string;
  precioDoc: number | null;
  precioCatalogo: number;
}): {
  cantidadInput: string;
  cajasInput: string;
  presentacion: string;
  precioUnitario: number;
  precioManual: boolean;
  packHint: string;
  autoPackFields: Array<"cajasInput" | "presentacion" | "cantidadInput">;
  /** REQ-124: frase de envase para Especificación, o "". */
  especificacionEnvase: string;
} {
  const converted = resolveCantidadPrecioDesdeEnvase({
    textoOriginal: params.textoOriginal,
    unidadMedidaCatalogo: params.unidadMedidaCatalogo,
    cantidadRaw: params.cantidad,
    precioDoc: params.precioDoc,
  });

  if (converted) {
    return {
      cantidadInput: String(converted.cantidad),
      cajasInput: "",
      presentacion: "",
      precioUnitario:
        converted.precioUnitario ??
        params.precioDoc ??
        params.precioCatalogo,
      precioManual:
        converted.precioUnitario != null || params.precioDoc != null,
      packHint: `Envase → ${converted.cantidad} ${params.unidadMedidaCatalogo || "u"} (${converted.frase})`,
      autoPackFields: ["cantidadInput"],
      especificacionEnvase: formatEspecificacionEnvase(converted),
    };
  }

  const baseLinea = {
    cajasInput:
      params.cajas != null && Number.isFinite(params.cajas)
        ? String(params.cajas)
        : "",
    presentacion: params.presentacion,
    cantidadInput:
      params.cantidad != null && Number.isFinite(params.cantidad)
        ? String(params.cantidad)
        : "",
  };
  const empaque = aplicarEmpaqueInicialLinea(baseLinea);
  return {
    cantidadInput: empaque.cantidadInput,
    cajasInput: empaque.cajasInput,
    presentacion: empaque.presentacion,
    precioUnitario: params.precioDoc ?? params.precioCatalogo,
    precioManual: params.precioDoc != null,
    packHint: empaque.packHint,
    autoPackFields: empaque.autoPackFields,
    especificacionEnvase: "",
  };
}

/**
 * Resuelve la clave que Mateo devolvió contra el catálogo real.
 * Acepta: exacta, case-insensitive, por SKU único entre paréntesis,
 * o por código de producto del cliente si calza un SKU único.
 * Nunca fuzzy libre aquí: eso solo alimenta sugerencias pendientes.
 */
function resolveProductoMatch(
  linea: {
    textoOriginal?: string | null;
    productoCatalogo: string | null;
    codigoProductoCliente?: string | null;
  },
  byKey: Map<string, ProductoVentaOption>,
  byCodigo: Map<string, ProductoVentaOption[]>,
  byKeyNorm: Map<string, ProductoVentaOption>,
): ProductoVentaOption | undefined {
  const textoCliente = linea.textoOriginal?.trim() || "";
  const accept = (p: ProductoVentaOption | undefined) =>
    p && productoCompatibleConTextoCliente(textoCliente, p) ? p : undefined;

  const clave = linea.productoCatalogo?.trim();
  if (clave) {
    const exact = accept(byKey.get(clave));
    if (exact) return exact;

    const byNorm = accept(byKeyNorm.get(normalizeCatalogKey(clave)));
    if (byNorm) return byNorm;

    const codigoClave = extractCodigoFromCatalogKey(clave);
    if (codigoClave) {
      const hits = byCodigo.get(norm(codigoClave)) ?? [];
      if (hits.length === 1) {
        const ok = accept(hits[0]);
        if (ok) return ok;
      }
    }
  }

  const codigoCliente = linea.codigoProductoCliente?.trim();
  if (codigoCliente) {
    const hits = byCodigo.get(norm(codigoCliente)) ?? [];
    if (hits.length === 1) {
      const ok = accept(hits[0]);
      if (ok) return ok;
    }
  }

  // Código en el texto del cliente (ej. «AGUACATE EXTRA … (115001005)»).
  const codigoEnTexto = extractCodigoFromCatalogKey(textoCliente);
  if (codigoEnTexto) {
    const hits = byCodigo.get(norm(codigoEnTexto)) ?? [];
    if (hits.length === 1) {
      const ok = accept(hits[0]);
      if (ok) return ok;
    }
  }

  return undefined;
}

/**
 * Unidad de la línea: prioriza el catálogo si es coherente con el texto.
 * Si el cliente dijo "litros" y el match/sugerencia trae KGM (o vacío), usa LTR.
 */
function inferUnidadDesdeTexto(
  texto: string,
  unidadCatalogo: string,
): string {
  const t = texto.toLowerCase();
  const fromText = /\b(litros?|lts?|ml)\b/.test(t)
    ? "LTR"
    : /\b(kilos?|kgs?|\bkg\b)\b/.test(t)
      ? "KGM"
      : "";
  const cat = unidadCatalogo.trim();
  const famCat = familiaUnidadCatalogo(cat);
  if (fromText === "LTR" && famCat !== "ltr") return "LTR";
  if (fromText === "KGM" && (famCat === "unknown" || !cat)) return "KGM";
  return cat || fromText;
}

function toSugerencia(
  producto: ProductoVentaOption,
): SugerenciaProductoCatalogo {
  return {
    idProducto: producto.idProducto,
    nombre: stripLeadingProductoCodigo(producto.nombre, producto.codigo),
    codigo: producto.codigo,
    idBodega: producto.idBodega,
    kgDisponible: producto.kgDisponible,
    unidadMedida: producto.unidadMedida,
    precioUnitario: producto.precioUnitario,
  };
}

/**
 * Rivales solo por typo (jass/hass). Variantes de talla/color de la misma familia
 * no cuentan: si Mateo/SKU ya encontró el producto, se asigna sin pedir confirmación.
 */
function findVecinosAmbiguos(
  query: string,
  chosen: ProductoVentaOption,
  productos: ProductoVentaOption[],
): ProductoVentaOption[] {
  if (!query.trim()) return [];
  return findTypoRivalProductos(query, chosen, productos);
}

/**
 * Rankea sugerencias cruzando texto del cliente, clave Mateo y SKU cliente.
 * Fusiona candidatos y marca ambigüedad si hay empate cercano.
 */
function pickSugerencias(
  linea: {
    textoOriginal?: string | null;
    productoCatalogo?: string | null;
    codigoProductoCliente?: string | null;
  },
  productos: ProductoVentaOption[],
): {
  sugerencia: SugerenciaProductoCatalogo | null;
  alternativas: SugerenciaProductoCatalogo[];
  ambiguo: boolean;
  topScore: number;
  secondScore: number | null;
  queryUsed: string;
} {
  const queries = [
    linea.textoOriginal?.trim(),
    linea.productoCatalogo?.trim(),
    linea.codigoProductoCliente?.trim(),
  ].filter((q): q is string => Boolean(q));

  if (queries.length === 0 || productos.length === 0) {
    return {
      sugerencia: null,
      alternativas: [],
      ambiguo: false,
      topScore: 0,
      secondScore: null,
      queryUsed: "",
    };
  }

  const byId = new Map<
    string,
    { producto: ProductoVentaOption; score: number }
  >();
  let anyAmbiguous = false;
  let queryUsed = queries[0] ?? "";

  for (const query of queries) {
    const ranked = rankProductosCatalogo(query, productos);
    if (ranked.ambiguous) anyAmbiguous = true;
    for (const candidate of ranked.candidates) {
      const prev = byId.get(candidate.producto.idProducto);
      if (!prev || candidate.score > prev.score) {
        byId.set(candidate.producto.idProducto, candidate);
        if (!prev || candidate.score > prev.score) {
          queryUsed = query;
        }
      }
    }
  }

  const merged = [...byId.values()].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.producto.nombre.localeCompare(b.producto.nombre, "es");
  });

  if (merged.length === 0) {
    return {
      sugerencia: null,
      alternativas: [],
      ambiguo: false,
      topScore: 0,
      secondScore: null,
      queryUsed,
    };
  }

  const top = merged[0]!;
  const second = merged[1];
  const closeTie =
    Boolean(second) && top.score - (second?.score ?? 0) < 0.1;

  return {
    sugerencia: toSugerencia(top.producto),
    alternativas: merged.slice(1, 3).map((c) => toSugerencia(c.producto)),
    ambiguo: anyAmbiguous || closeTie,
    topScore: top.score,
    secondScore: second?.score ?? null,
    queryUsed,
  };
}

function compareOverride(params: {
  fieldKey: string;
  label: string;
  valorDb: string;
  valorIa: string | null | undefined;
  patch: Record<string, string>;
  autoFields: Set<string>;
  warnFields: Set<string>;
  discrepancias: CampoDiscrepancia[];
  /** Si true y la ficha ya tiene valor, no lo pisa la IA (datos de comprador). */
  preferFicha?: boolean;
}): void {
  const {
    fieldKey,
    label,
    valorDb,
    valorIa,
    patch,
    autoFields,
    warnFields,
    discrepancias,
    preferFicha = false,
  } = params;
  if (valorIa == null || !String(valorIa).trim()) {
    return;
  }
  const ia = String(valorIa).trim();

  // Ficha del comprador manda: la IA solo completa huecos (evita basura del PDF/correo).
  if (preferFicha && valorDb.trim()) {
    if (norm(valorDb) !== norm(ia)) {
      discrepancias.push({ campo: label, fieldKey, db: valorDb, ia });
    }
    return;
  }

  patch[fieldKey] = ia;
  if (norm(valorDb) === norm(ia)) {
    autoFields.add(fieldKey);
    warnFields.delete(fieldKey);
    return;
  }
  if (valorDb.trim()) {
    warnFields.add(fieldKey);
    autoFields.delete(fieldKey);
    discrepancias.push({ campo: label, fieldKey, db: valorDb || "—", ia });
  } else {
    autoFields.add(fieldKey);
  }
}

/**
 * Traduce PedidoExtraido al estado del modal.
 * Entrega (dirección, andén, contacto, teléfono, correo, ventana): lo que
 * Mateo leyó del correo, mensaje o PDF manda; la ficha del comprador solo
 * rellena lo que el documento no trajo.
 */
export function mapPedidoExtraidoToForm(params: {
  pedido: PedidoExtraido;
  productos: ProductoVentaOption[];
  ficha: {
    centroConsumo: string;
    ventanaDesde: string;
    ventanaHasta: string;
    direccion: string;
    anden: string;
    contacto: string;
    telefono: string;
    correo: string;
    aceptaSustituciones: string;
    requiereLote: string;
    registrarTemperatura: string;
    observaciones: string;
  };
  tomorrowIso: string;
  todayIso: string;
}): PedidoIaFormPatch {
  const { pedido, productos, ficha, tomorrowIso, todayIso } = params;
  const autoFields = new Set<string>();
  const warnFields = new Set<string>();
  const discrepancias: CampoDiscrepancia[] = [];
  const patch: Record<string, string> = {
    fechaEntrega: "",
    centroConsumo: ficha.centroConsumo,
    observaciones: ficha.observaciones,
    ordenCompraHotel: "",
    direccion: ficha.direccion,
    anden: ficha.anden,
    contacto: ficha.contacto,
    telefono: ficha.telefono,
    correo: ficha.correo,
    ventanaDesde: ficha.ventanaDesde,
    ventanaHasta: ficha.ventanaHasta,
    aceptaSustituciones: ficha.aceptaSustituciones,
    requiereLote: ficha.requiereLote,
    registrarTemperatura: ficha.registrarTemperatura,
  };

  for (const key of [
    "centroConsumo",
    "direccion",
    "anden",
    "contacto",
    "telefono",
    "correo",
    "ventanaDesde",
    "ventanaHasta",
    "aceptaSustituciones",
    "requiereLote",
    "registrarTemperatura",
    "observaciones",
  ] as const) {
    if (patch[key]) autoFields.add(key);
  }

  // Fecha/hora del cuerpo u origen_correo mandan sobre el default de mañana.
  const fechaFromOrigen = (() => {
    for (const row of pedido.origenCorreo ?? []) {
      const raw =
        row && typeof row === "object" && "Fecha" in row
          ? String((row as { Fecha?: unknown }).Fecha ?? "")
          : "";
      const parsed = parseFechaOrigen(raw);
      if (parsed) return parsed;
    }
    return null;
  })();
  const fromBody = extractEntregaDesdeTexto(
    [
      pedido.textoOrigen,
      pedido.observaciones,
      pedido.notasGeneralesAlmacen,
    ]
      .filter(Boolean)
      .join("\n"),
    todayIso,
  );
  const fechaLeida =
    pedido.fechaEntrega?.trim() || fechaFromOrigen || fromBody.fechaIso || null;
  const fechaPorDefecto = !fechaLeida;
  const fecha = fechaLeida || tomorrowIso;
  patch.fechaEntrega = fecha;
  if (isFechaEntregaAtrasada(fecha, todayIso)) {
    warnFields.add("fechaEntrega");
    autoFields.delete("fechaEntrega");
    discrepancias.push({
      campo: "Fecha de entrega",
      fieldKey: "fechaEntrega",
      db: "Hoy o posterior",
      ia: `${formatCapturaFecha(fecha)} · ${FECHA_ENTREGA_ATRASADA_WARNING}`,
    });
  } else if (fechaPorDefecto) {
    warnFields.add("fechaEntrega");
    autoFields.delete("fechaEntrega");
    discrepancias.push({
      campo: "Fecha de entrega",
      fieldKey: "fechaEntrega",
      db: "Leída del correo",
      ia: `${formatCapturaFecha(fecha)} · ${FECHA_ENTREGA_DEFAULT_WARNING}`,
    });
  } else {
    autoFields.add("fechaEntrega");
  }

  const horarioDesdeIa =
    pedido.horarioDesde?.trim() || fromBody.horarioDesde || null;
  const horarioHastaIa =
    pedido.horarioHasta?.trim() || fromBody.horarioHasta || null;

  if (pedido.ordenCompraHotel?.trim()) {
    patch.ordenCompraHotel = pedido.ordenCompraHotel.trim();
    autoFields.add("ordenCompraHotel");
  }
  compareOverride({
    fieldKey: "centroConsumo",
    label: "Centro de consumo",
    valorDb: ficha.centroConsumo,
    valorIa: pedido.centroConsumo,
    patch,
    autoFields,
    warnFields,
    discrepancias,
    preferFicha: true,
  });
  // Entrega: Ship To del texto manda; luego Mateo; ficha solo si no hay dato.
  const direccionShipTo = extractDireccionShipToDesdeTexto(
    [
      pedido.textoOrigen,
      pedido.observaciones,
      pedido.notasGeneralesAlmacen,
    ]
      .filter(Boolean)
      .join("\n"),
  );
  compareOverride({
    fieldKey: "direccion",
    label: "Dirección de entrega",
    valorDb: ficha.direccion,
    valorIa: direccionShipTo || pedido.direccion,
    patch,
    autoFields,
    warnFields,
    discrepancias,
  });
  compareOverride({
    fieldKey: "anden",
    label: "Andén",
    valorDb: ficha.anden,
    valorIa: pedido.anden,
    patch,
    autoFields,
    warnFields,
    discrepancias,
  });
  compareOverride({
    fieldKey: "contacto",
    label: "Contacto",
    valorDb: ficha.contacto,
    valorIa: pedido.contacto,
    patch,
    autoFields,
    warnFields,
    discrepancias,
  });
  compareOverride({
    fieldKey: "telefono",
    label: "Teléfono",
    valorDb: sanitizeTelefonoContacto(ficha.telefono),
    valorIa: sanitizeTelefonoContacto(pedido.telefono) || null,
    patch,
    autoFields,
    warnFields,
    discrepancias,
  });
  compareOverride({
    fieldKey: "correo",
    label: "Correo",
    valorDb: ficha.correo,
    valorIa: pedido.correo,
    patch,
    autoFields,
    warnFields,
    discrepancias,
  });
  compareOverride({
    fieldKey: "ventanaDesde",
    label: "Ventana desde",
    valorDb: ficha.ventanaDesde,
    valorIa: horarioDesdeIa,
    patch,
    autoFields,
    warnFields,
    discrepancias,
  });
  compareOverride({
    fieldKey: "ventanaHasta",
    label: "Ventana hasta",
    valorDb: ficha.ventanaHasta,
    valorIa: horarioHastaIa,
    patch,
    autoFields,
    warnFields,
    discrepancias,
  });
  compareOverride({
    fieldKey: "aceptaSustituciones",
    label: "Sustituciones",
    valorDb: ficha.aceptaSustituciones,
    valorIa: pedido.sustituciones,
    patch,
    autoFields,
    warnFields,
    discrepancias,
    preferFicha: true,
  });
  compareOverride({
    fieldKey: "requiereLote",
    label: "Requiere lote",
    valorDb: ficha.requiereLote,
    valorIa: pedido.lote,
    patch,
    autoFields,
    warnFields,
    discrepancias,
    preferFicha: true,
  });
  compareOverride({
    fieldKey: "registrarTemperatura",
    label: "Registrar temperatura",
    valorDb: ficha.registrarTemperatura,
    valorIa: pedido.temperatura,
    patch,
    autoFields,
    warnFields,
    discrepancias,
    preferFicha: true,
  });

  // Notas generales: IA corta o especificaciones del correo (nunca el hilo).
  const notasIa =
    pedido.notasGeneralesAlmacen?.trim() ||
    pedido.observaciones?.trim() ||
    "";
  const sanitized = sanitizeNotasGeneralesPedido(
    notasIa,
    pedido.textoOrigen,
  );
  if (sanitized) {
    patch.observaciones = sanitized;
    autoFields.add("observaciones");
  }

  const byKey = new Map(
    productos.map((p) => [catalogKey(p.nombre, p.codigo), p] as const),
  );
  const byKeyNorm = new Map(
    productos.map(
      (p) =>
        [normalizeCatalogKey(catalogKey(p.nombre, p.codigo)), p] as const,
    ),
  );
  const byCodigo = new Map<string, ProductoVentaOption[]>();
  for (const p of productos) {
    const key = norm(p.codigo);
    if (!key) continue;
    const list = byCodigo.get(key) ?? [];
    list.push(p);
    byCodigo.set(key, list);
  }

  const lineas: LineaVentaFromIa[] = [];

  for (const linea of pedido.lineas) {
    const match = resolveProductoMatch(linea, byKey, byCodigo, byKeyNorm);
    const textoOriginal = linea.textoOriginal?.trim() || "";

    const presentacion =
      linea.presentacion && PRESENTACION_SET.has(linea.presentacion)
        ? linea.presentacion
        : "";

    const precioDoc = parsePrecioIa(linea.precioUnitario);
    // Misma clave que groupOrigenCorreoToOrdenesTrabajo (sin fallbacks de
    // cabecera): si no, el pager OT filtra y la página queda sin productos.
    const otId = groupKeyOrigenCorreo({
      "Numero pedido": linea.numeroPedido || "",
      Almacen: linea.almacen || "",
      "Referencia pedido": linea.referenciaPedido || "",
    });

    if (match) {
      const qty = resolveLineaCantidadPrecioEmpaque({
        textoOriginal,
        unidadMedidaCatalogo: match.unidadMedida,
        cantidad: linea.cantidad,
        cajas: linea.cajas,
        presentacion,
        precioDoc,
        precioCatalogo: match.precioUnitario,
      });
      // Aunque Mateo dio clave exacta, si el texto del cliente también
      // se parece a OTRO producto (typo jass/hass, variantes), pedir confirmación.
      const vecinos = findVecinosAmbiguos(textoOriginal || match.nombre, match, productos);
      if (vecinos.length > 0) {
        const codigoCliente =
          linea.codigoProductoCliente?.trim() ||
          extractCodigoFromCatalogKey(textoOriginal) ||
          "";
        lineas.push({
          idProducto: "",
          nombre: textoOriginal || stripLeadingProductoCodigo(match.nombre, match.codigo),
          codigo: codigoCliente || "—",
          idBodega: match.idBodega,
          cantidadInput: qty.cantidadInput,
          cajasInput: qty.cajasInput,
          presentacion: qty.presentacion,
          especificacion:
            qty.especificacionEnvase || linea.especificacion?.trim() || "",
          descuentoPctInput: "0",
          ivaPct: "0",
          kgDisponible: match.kgDisponible,
          unidadMedida: inferUnidadDesdeTexto(
            textoOriginal,
            match.unidadMedida,
          ),
          precioUnitario: qty.precioUnitario,
          precioManual: qty.precioManual,
          aliasCliente: textoOriginal,
          filledByIa: true,
          otId,
          packHint: qty.packHint,
          autoPackFields: qty.autoPackFields,
          catalogPending: true,
          catalogAmbiguo: true,
          sugerencia: toSugerencia(match),
          sugerenciasAlternativas: vecinos.map(toSugerencia),
        });
        continue;
      }

      lineas.push({
        idProducto: match.idProducto,
        nombre: stripLeadingProductoCodigo(match.nombre, match.codigo),
        codigo: match.codigo,
        idBodega: match.idBodega,
        cantidadInput: qty.cantidadInput,
        cajasInput: qty.cajasInput,
        presentacion: qty.presentacion,
        especificacion:
          qty.especificacionEnvase || linea.especificacion?.trim() || "",
        descuentoPctInput: "0",
        ivaPct: "0",
        kgDisponible: match.kgDisponible,
        unidadMedida: inferUnidadDesdeTexto(
          textoOriginal,
          match.unidadMedida,
        ),
        precioUnitario: qty.precioUnitario,
        precioManual: qty.precioManual,
        aliasCliente: textoOriginal,
        filledByIa: true,
        otId,
        packHint: qty.packHint,
        autoPackFields: qty.autoPackFields,
        catalogPending: false,
        catalogAmbiguo: false,
        sugerencia: null,
        sugerenciasAlternativas: [],
      });
      continue;
    }

    // Sin clave exacta de Mateo: sugerencias cercanas; auto-asignar si es claro.
    const picked = pickSugerencias(linea, productos);
    const { sugerencia, alternativas, ambiguo } = picked;
    const qty = resolveLineaCantidadPrecioEmpaque({
      textoOriginal,
      unidadMedidaCatalogo: sugerencia?.unidadMedida ?? "",
      cantidad: linea.cantidad,
      cajas: linea.cajas,
      presentacion,
      precioDoc,
      precioCatalogo: sugerencia?.precioUnitario ?? 0,
    });
    const precioUnitario = qty.precioUnitario;

    const codigoClienteNorm = norm(linea.codigoProductoCliente);
    const codigoEnTextoNorm = norm(
      extractCodigoFromCatalogKey(textoOriginal) ?? "",
    );
    const mismoCodigo =
      Boolean(sugerencia) &&
      (codigoClienteNorm === norm(sugerencia?.codigo) ||
        codigoEnTextoNorm === norm(sugerencia?.codigo));

    const autoAccept =
      sugerencia != null &&
      (mismoCodigo ||
        shouldAutoAcceptProductoSuggestion({
          query: picked.queryUsed || textoOriginal,
          sugerenciaNombre: sugerencia.nombre,
          sugerenciaCodigo: sugerencia.codigo,
          topScore: picked.topScore,
          secondScore: picked.secondScore,
          ambiguous: ambiguo,
        }));

    if (autoAccept && sugerencia) {
      const catalogo = productos.find(
        (p) => p.idProducto === sugerencia.idProducto,
      );
      lineas.push({
        idProducto: sugerencia.idProducto,
        nombre: stripLeadingProductoCodigo(
          catalogo?.nombre ?? sugerencia.nombre,
          sugerencia.codigo,
        ),
        codigo: sugerencia.codigo,
        idBodega: sugerencia.idBodega,
        cantidadInput: qty.cantidadInput,
        cajasInput: qty.cajasInput,
        presentacion: qty.presentacion,
        especificacion:
          qty.especificacionEnvase || linea.especificacion?.trim() || "",
        descuentoPctInput: "0",
        ivaPct: "0",
        kgDisponible: sugerencia.kgDisponible,
        unidadMedida: inferUnidadDesdeTexto(
          textoOriginal,
          sugerencia.unidadMedida,
        ),
        precioUnitario,
        precioManual: qty.precioManual,
        aliasCliente: textoOriginal,
        filledByIa: true,
        otId,
        packHint: qty.packHint,
        autoPackFields: qty.autoPackFields,
        catalogPending: false,
        catalogAmbiguo: false,
        sugerencia: null,
        sugerenciasAlternativas: [],
      });
      continue;
    }

    const codigoClientePending =
      linea.codigoProductoCliente?.trim() ||
      extractCodigoFromCatalogKey(textoOriginal) ||
      "";
    lineas.push({
      idProducto: "",
      nombre: textoOriginal || "Producto no identificado",
      codigo: codigoClientePending || "—",
      idBodega: sugerencia?.idBodega ?? "",
      cantidadInput: qty.cantidadInput,
      cajasInput: qty.cajasInput,
      presentacion: qty.presentacion,
      especificacion:
        qty.especificacionEnvase || linea.especificacion?.trim() || "",
      descuentoPctInput: "0",
      ivaPct: "0",
      kgDisponible: sugerencia?.kgDisponible ?? 0,
      unidadMedida: inferUnidadDesdeTexto(
        textoOriginal,
        sugerencia?.unidadMedida ?? "",
      ),
      precioUnitario,
      precioManual: qty.precioManual,
      aliasCliente: textoOriginal,
      filledByIa: true,
      otId,
      packHint: qty.packHint,
      autoPackFields: qty.autoPackFields,
      catalogPending: true,
      catalogAmbiguo: ambiguo,
      sugerencia,
      sugerenciasAlternativas: alternativas,
    });
  }

  const operativoValues = {
    fechaEntrega: patch.fechaEntrega,
    centroConsumo: patch.centroConsumo,
    direccion: patch.direccion,
    anden: patch.anden,
    contacto: patch.contacto,
    telefono: sanitizeTelefonoContacto(patch.telefono),
    correo: patch.correo,
    ventanaDesde: patch.ventanaDesde,
    ventanaHasta: patch.ventanaHasta,
  } satisfies Record<CampoOperativoDocs, string>;

  const missingFields = collectMissingFieldsDocs(operativoValues);

  return {
    fechaEntrega: patch.fechaEntrega,
    centroConsumo: patch.centroConsumo,
    observaciones: patch.observaciones,
    ordenCompraHotel: patch.ordenCompraHotel,
    direccion: patch.direccion,
    anden: patch.anden,
    contacto: patch.contacto,
    telefono: sanitizeTelefonoContacto(patch.telefono),
    correo: patch.correo,
    ventanaDesde: patch.ventanaDesde,
    ventanaHasta: patch.ventanaHasta,
    aceptaSustituciones: patch.aceptaSustituciones,
    requiereLote: patch.requiereLote,
    registrarTemperatura: patch.registrarTemperatura,
    autoFields,
    warnFields,
    missingFields,
    discrepancias,
    lineas,
    advertencia: pedido.advertencia,
    archivosNoLegibles: pedido.archivosNoLegibles ?? [],
  };
}
