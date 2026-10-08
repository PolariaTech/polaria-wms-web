import type { PedidoExtraido } from "../ai/openai-pedido.client";
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
  rankProductosCatalogo,
  scoreProductoMatch,
  shouldAutoAcceptProductoSuggestion,
} from "./find-closest-producto-catalogo";
import { groupKeyOrigenCorreo } from "./origen-correo-ordenes-trabajo";
import {
  FECHA_ENTREGA_ATRASADA_WARNING,
  isFechaEntregaAtrasada,
} from "./pedido-form-validation";
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
  const clave = linea.productoCatalogo?.trim();
  if (clave) {
    const exact = byKey.get(clave);
    if (exact) return exact;

    const byNorm = byKeyNorm.get(normalizeCatalogKey(clave));
    if (byNorm) return byNorm;

    const codigoClave = extractCodigoFromCatalogKey(clave);
    if (codigoClave) {
      const hits = byCodigo.get(norm(codigoClave)) ?? [];
      if (hits.length === 1) return hits[0];
    }
  }

  const codigoCliente = linea.codigoProductoCliente?.trim();
  if (codigoCliente) {
    const hits = byCodigo.get(norm(codigoCliente)) ?? [];
    if (hits.length === 1) return hits[0];
  }

  // Código en el texto del cliente (ej. «AGUACATE EXTRA … (115001005)»).
  const codigoEnTexto = extractCodigoFromCatalogKey(
    linea.textoOriginal?.trim() || "",
  );
  if (codigoEnTexto) {
    const hits = byCodigo.get(norm(codigoEnTexto)) ?? [];
    if (hits.length === 1) return hits[0];
  }

  return undefined;
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
 * Entrega (dirección, andén, contacto, teléfono, ventana): lo que Mateo
 * leyó del correo, mensaje o PDF manda; la ficha del comprador solo
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
    "ventanaDesde",
    "ventanaHasta",
    "aceptaSustituciones",
    "requiereLote",
    "registrarTemperatura",
    "observaciones",
  ] as const) {
    if (patch[key]) autoFields.add(key);
  }

  const fecha = pedido.fechaEntrega?.trim() || tomorrowIso;
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
  } else {
    autoFields.add("fechaEntrega");
  }

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
  // Entrega: documento primero; ficha solo si Mateo no encontró el dato.
  compareOverride({
    fieldKey: "direccion",
    label: "Dirección de entrega",
    valorDb: ficha.direccion,
    valorIa: pedido.direccion,
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
    valorDb: ficha.telefono,
    valorIa: pedido.telefono,
    patch,
    autoFields,
    warnFields,
    discrepancias,
  });
  compareOverride({
    fieldKey: "ventanaDesde",
    label: "Ventana desde",
    valorDb: ficha.ventanaDesde,
    valorIa: pedido.horarioDesde,
    patch,
    autoFields,
    warnFields,
    discrepancias,
  });
  compareOverride({
    fieldKey: "ventanaHasta",
    label: "Ventana hasta",
    valorDb: ficha.ventanaHasta,
    valorIa: pedido.horarioHasta,
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

    const baseLinea = {
      cajasInput:
        linea.cajas != null && Number.isFinite(linea.cajas)
          ? String(linea.cajas)
          : "",
      presentacion,
      cantidadInput:
        linea.cantidad != null && Number.isFinite(linea.cantidad)
          ? String(linea.cantidad)
          : "",
    };
    const empaque = aplicarEmpaqueInicialLinea(baseLinea);
    const precioDoc = parsePrecioIa(linea.precioUnitario);
    // Misma clave que groupOrigenCorreoToOrdenesTrabajo (sin fallbacks de
    // cabecera): si no, el pager OT filtra y la página queda sin productos.
    const otId = groupKeyOrigenCorreo({
      "Numero pedido": linea.numeroPedido || "",
      Almacen: linea.almacen || "",
      "Referencia pedido": linea.referenciaPedido || "",
    });

    if (match) {
      // Aunque Mateo dio clave exacta, si el texto del cliente también
      // se parece a OTRO producto (typo jass/hass, variantes), pedir confirmación.
      const vecinos = findVecinosAmbiguos(textoOriginal || match.nombre, match, productos);
      if (vecinos.length > 0) {
        const precioUnitario =
          precioDoc ?? match.precioUnitario;
        lineas.push({
          idProducto: "",
          nombre: textoOriginal || stripLeadingProductoCodigo(match.nombre, match.codigo),
          codigo: "—",
          idBodega: match.idBodega,
          cantidadInput: empaque.cantidadInput,
          cajasInput: empaque.cajasInput,
          presentacion: empaque.presentacion,
          especificacion: linea.especificacion?.trim() || "",
          descuentoPctInput: "0",
          ivaPct: "0",
          kgDisponible: match.kgDisponible,
          unidadMedida: match.unidadMedida,
          precioUnitario,
          precioManual: precioDoc != null,
          aliasCliente: textoOriginal,
          filledByIa: true,
          otId,
          packHint: empaque.packHint,
          autoPackFields: empaque.autoPackFields,
          catalogPending: true,
          catalogAmbiguo: true,
          sugerencia: toSugerencia(match),
          sugerenciasAlternativas: vecinos.map(toSugerencia),
        });
        continue;
      }

      const precioUnitario = precioDoc ?? match.precioUnitario;
      lineas.push({
        idProducto: match.idProducto,
        nombre: stripLeadingProductoCodigo(match.nombre, match.codigo),
        codigo: match.codigo,
        idBodega: match.idBodega,
        cantidadInput: empaque.cantidadInput,
        cajasInput: empaque.cajasInput,
        presentacion: empaque.presentacion,
        especificacion: linea.especificacion?.trim() || "",
        descuentoPctInput: "0",
        ivaPct: "0",
        kgDisponible: match.kgDisponible,
        unidadMedida: match.unidadMedida,
        precioUnitario,
        precioManual: precioDoc != null,
        aliasCliente: textoOriginal,
        filledByIa: true,
        otId,
        packHint: empaque.packHint,
        autoPackFields: empaque.autoPackFields,
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
    const precioUnitario =
      precioDoc ?? sugerencia?.precioUnitario ?? 0;

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
        cantidadInput: empaque.cantidadInput,
        cajasInput: empaque.cajasInput,
        presentacion: empaque.presentacion,
        especificacion: linea.especificacion?.trim() || "",
        descuentoPctInput: "0",
        ivaPct: "0",
        kgDisponible: sugerencia.kgDisponible,
        unidadMedida: sugerencia.unidadMedida,
        precioUnitario,
        precioManual: precioDoc != null,
        aliasCliente: textoOriginal,
        filledByIa: true,
        otId,
        packHint: empaque.packHint,
        autoPackFields: empaque.autoPackFields,
        catalogPending: false,
        catalogAmbiguo: false,
        sugerencia: null,
        sugerenciasAlternativas: [],
      });
      continue;
    }

    lineas.push({
      idProducto: "",
      nombre: textoOriginal || "Producto sin catálogo",
      codigo: "—",
      idBodega: sugerencia?.idBodega ?? "",
      cantidadInput: empaque.cantidadInput,
      cajasInput: empaque.cajasInput,
      presentacion: empaque.presentacion,
      especificacion: linea.especificacion?.trim() || "",
      descuentoPctInput: "0",
      ivaPct: "0",
      kgDisponible: sugerencia?.kgDisponible ?? 0,
      unidadMedida: sugerencia?.unidadMedida ?? "",
      precioUnitario,
      precioManual: precioDoc != null,
      aliasCliente: textoOriginal,
      filledByIa: true,
      otId,
      packHint: empaque.packHint,
      autoPackFields: empaque.autoPackFields,
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
    telefono: patch.telefono,
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
    telefono: patch.telefono,
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
