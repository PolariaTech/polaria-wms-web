import type { PedidoExtraido } from "../../ai/openai-pedido.client";
import { sanitizeTelefonoContacto } from "./sanitize-telefono-contacto";
import type { FuenteAsignacion, ProductoVentaOption } from "../../../shared/types/sales.types";
import { fraseClienteAmbigua, indiceFrasesCliente, productoPorFraseCliente } from "../match/frase-cliente";
import { stripLeadingProductoCodigo } from "../../../shared/utils/producto-venta-nombre";
import { formatCapturaFecha } from "./build-orden-venta-captura-observaciones";
import {
  collectMissingFieldsDocs,
  type CampoOperativoDocs,
} from "./empaque-lineas";
import { rankSinCodigoContradicho } from "../match/codigo-contradice-nombre";
import {
  findTypoRivalProductos,
  productoCompatibleConTextoCliente,
  scoreProductoMatch,
  shouldAutoAcceptProductoSuggestion,
} from "../match/find-closest-producto-catalogo";
import { sustantivoPrincipalAusente } from "../match/sustantivo-principal";
import { contiguousOtIdsFromPedidoLineas } from "../origen/origen-correo-ot-contigua";
import {
  extractDireccionShipToDesdeTexto,
  extractEntregaDesdeTexto,
} from "./extract-entrega-desde-texto";
import { parseFechaOrigen } from "../origen/materialize-ov-desde-origen";
import {
  FECHA_ENTREGA_ATRASADA_WARNING,
  FECHA_ENTREGA_DEFAULT_WARNING,
  isFechaEntregaAtrasada,
} from "./pedido-form-validation";
import { resolveLineaCantidadPrecioEmpaque } from "./resolve-linea-cantidad-precio-empaque";
import { unidadYEspecificacionLineaForm } from "./map-pedido-unidad-y-espec";
import { asegurarNotasGeneralesPedido } from "../origen/sanitize-notas-generales-pedido";
import { resolveOrdenCompraLimpia } from "./normalize-numero-pedido";

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
  propuestaSistema?: {
    producto: { idProducto: string; nombre: string; codigo: string } | null;
    fuente: FuenteAsignacion | null;
  };
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

/** SKU único en el mapa de códigos; si hay varios, no elige. */
function productoUnicoPorCodigo(
  codigo: string | null | undefined,
  byCodigo: Map<string, ProductoVentaOption[]>,
): ProductoVentaOption | undefined {
  const key = norm(codigo ?? "");
  if (!key) return undefined;
  const hits = byCodigo.get(key) ?? [];
  return hits.length === 1 ? hits[0] : undefined;
}

/**
 * Orden: código único del cliente, frase del comprador, clave de Mateo.
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
  indiceFrases: ReadonlyMap<string, ProductoVentaOption | null>,
): { producto: ProductoVentaOption; fuente: FuenteAsignacion } | undefined {
  const textoCliente = linea.textoOriginal?.trim() || "";
  const accept = (p: ProductoVentaOption | undefined) =>
    p &&
    productoCompatibleConTextoCliente(textoCliente, p) &&
    !sustantivoPrincipalAusente(textoCliente, p)
      ? p
      : undefined;

  const porCodigoCliente = accept(
    productoUnicoPorCodigo(linea.codigoProductoCliente, byCodigo),
  );
  if (porCodigoCliente) return { producto: porCodigoCliente, fuente: "codigo" };
  const porCodigoEnTexto = accept(
    productoUnicoPorCodigo(extractCodigoFromCatalogKey(textoCliente), byCodigo),
  );
  if (porCodigoEnTexto) return { producto: porCodigoEnTexto, fuente: "codigo" };

  if (fraseClienteAmbigua(textoCliente, indiceFrases)) return undefined;
  const porFrase = productoPorFraseCliente(textoCliente, indiceFrases);
  if (porFrase) return { producto: porFrase, fuente: "frase" };

  const clave = linea.productoCatalogo?.trim();
  if (!clave) return undefined;
  const exact = accept(byKey.get(clave));
  if (exact) return { producto: exact, fuente: "catalogo" };
  const byNorm = accept(byKeyNorm.get(normalizeCatalogKey(clave)));
  if (byNorm) return { producto: byNorm, fuente: "catalogo" };
  const porCodigoClave = accept(
    productoUnicoPorCodigo(extractCodigoFromCatalogKey(clave), byCodigo),
  );
  if (porCodigoClave) return { producto: porCodigoClave, fuente: "catalogo" };
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
  // REQ-311: no usar productoCatalogo como query fuzzy — una clave Mateo
  // equivocada (PULPA, otro color) contaminaba sugerencias y dejaba amarillo.
  const queries = [
    linea.textoOriginal?.trim(),
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
    const ranked = rankSinCodigoContradicho(query, productos, linea);
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

  {
    const occ = resolveOrdenCompraLimpia(
      pedido.ordenCompraHotel,
      pedido.textoOrigen ?? "",
    );
    if (occ) {
      patch.ordenCompraHotel = occ;
      autoFields.add("ordenCompraHotel");
    }
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

  // REQ-340: Mateo (o scrap del origen) siempre deja algo en notas; el usuario puede
  // sobrescribir después. No usar asegurar al reabrir OV con borrado intencional.
  const notasIa =
    pedido.notasGeneralesAlmacen?.trim() ||
    pedido.observaciones?.trim() ||
    "";
  patch.observaciones = asegurarNotasGeneralesPedido(
    notasIa,
    pedido.textoOrigen,
  );
  autoFields.add("observaciones");

  const byKey = new Map(
    productos.map((p) => [catalogKey(p.nombre, p.codigo), p] as const),
  );
  const byKeyNorm = new Map(
    productos.map((p) => [normalizeCatalogKey(catalogKey(p.nombre, p.codigo)), p] as const),
  );
  const byCodigo = new Map<string, ProductoVentaOption[]>();
  for (const p of productos) {
    const key = norm(p.codigo);
    if (!key) continue;
    const list = byCodigo.get(key) ?? [];
    list.push(p);
    byCodigo.set(key, list);
  }
  const indiceFrases = indiceFrasesCliente(productos);

  const lineas: LineaVentaFromIa[] = [];
  // REQ-238: misma clave OT que groupOrigenCorreoToOrdenesTrabajo (bloques contiguos).
  const otIdsPorLinea = contiguousOtIdsFromPedidoLineas(pedido.lineas);

  for (let index = 0; index < pedido.lineas.length; index += 1) {
    const linea = pedido.lineas[index]!;
    const resolucion = resolveProductoMatch(linea, byKey, byCodigo, byKeyNorm, indiceFrases);
    const match = resolucion?.producto;
    const textoOriginal = linea.textoOriginal?.trim() || "";

    const presentacion =
      linea.presentacion && PRESENTACION_SET.has(linea.presentacion)
        ? linea.presentacion
        : "";

    const precioDoc = parsePrecioIa(linea.precioUnitario);
    const otId = otIdsPorLinea[index] ?? "default";

    if (match) {
      const qty = resolveLineaCantidadPrecioEmpaque({
        textoOriginal,
        unidadMedidaCatalogo: match.unidadMedida,
        cantidad: linea.cantidad,
        cajas: linea.cajas,
        presentacion,
        precioDoc,
        precioCatalogo: match.precioUnitario,
        especificacionIa: linea.especificacion,
      });
      // Clave exacta: si el texto también se parece a otro producto, pedir confirmación.
      const vecinos =
        resolucion.fuente === "frase"
          ? []
          : findVecinosAmbiguos(textoOriginal || match.nombre, match, productos);
      if (vecinos.length > 0) {
        const codigoCliente =
          linea.codigoProductoCliente?.trim() ||
          extractCodigoFromCatalogKey(textoOriginal) ||
          "";
        const ueAmbiguo = unidadYEspecificacionLineaForm({
          textoOriginal,
          especificacionIa: linea.especificacion,
          especificacionEnvase: qty.especificacionEnvase,
          unidadOrigen: linea.unidad,
          unidadCatalogo: match.unidadMedida,
        });
        lineas.push({
          idProducto: "",
          nombre: textoOriginal || stripLeadingProductoCodigo(match.nombre, match.codigo),
          codigo: codigoCliente || "—",
          idBodega: match.idBodega,
          cantidadInput: qty.cantidadInput,
          cajasInput: qty.cajasInput,
          presentacion: qty.presentacion,
          especificacion: ueAmbiguo.especificacion,
          ivaPct: "0",
          kgDisponible: match.kgDisponible,
          unidadMedida: ueAmbiguo.unidadMedida,
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
          propuestaSistema: { producto: null, fuente: null },
        });
        continue;
      }

      const ueMatch = unidadYEspecificacionLineaForm({
        textoOriginal,
        especificacionIa: linea.especificacion,
        especificacionEnvase: qty.especificacionEnvase,
        unidadOrigen: linea.unidad,
        unidadCatalogo: match.unidadMedida,
      });
      lineas.push({
        idProducto: match.idProducto,
        nombre: stripLeadingProductoCodigo(match.nombre, match.codigo),
        codigo: match.codigo,
        idBodega: match.idBodega,
        cantidadInput: qty.cantidadInput,
        cajasInput: qty.cajasInput,
        presentacion: qty.presentacion,
        especificacion: ueMatch.especificacion,
        ivaPct: "0",
        kgDisponible: match.kgDisponible,
        unidadMedida: ueMatch.unidadMedida,
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
        propuestaSistema: {
          producto: { idProducto: match.idProducto, nombre: match.nombre, codigo: match.codigo },
          fuente: resolucion.fuente,
        },
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
      especificacionIa: linea.especificacion,
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
      !fraseClienteAmbigua(textoOriginal, indiceFrases) &&
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
      const ueAuto = unidadYEspecificacionLineaForm({
        textoOriginal,
        especificacionIa: linea.especificacion,
        especificacionEnvase: qty.especificacionEnvase,
        unidadOrigen: linea.unidad,
        unidadCatalogo: sugerencia.unidadMedida,
      });
      lineas.push({
        idProducto: sugerencia.idProducto,
        nombre: stripLeadingProductoCodigo(catalogo?.nombre ?? sugerencia.nombre, sugerencia.codigo),
        codigo: sugerencia.codigo,
        idBodega: sugerencia.idBodega,
        cantidadInput: qty.cantidadInput,
        cajasInput: qty.cajasInput,
        presentacion: qty.presentacion,
        especificacion: ueAuto.especificacion,
        ivaPct: "0",
        kgDisponible: sugerencia.kgDisponible,
        unidadMedida: ueAuto.unidadMedida,
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
        propuestaSistema: {
          producto: {
            idProducto: sugerencia.idProducto,
            nombre: catalogo?.nombre ?? sugerencia.nombre,
            codigo: sugerencia.codigo,
          },
          fuente: "difuso",
        },
      });
      continue;
    }

    const codigoClientePending =
      linea.codigoProductoCliente?.trim() ||
      extractCodigoFromCatalogKey(textoOriginal) ||
      "";
    const uePendiente = unidadYEspecificacionLineaForm({
      textoOriginal,
      especificacionIa: linea.especificacion,
      especificacionEnvase: qty.especificacionEnvase,
      unidadOrigen: linea.unidad,
      unidadCatalogo: sugerencia?.unidadMedida ?? "",
    });
    lineas.push({
      idProducto: "",
      nombre: textoOriginal || "Producto no identificado",
      codigo: codigoClientePending || "—",
      idBodega: sugerencia?.idBodega ?? "",
      cantidadInput: qty.cantidadInput,
      cajasInput: qty.cajasInput,
      presentacion: qty.presentacion,
      especificacion: uePendiente.especificacion,
      ivaPct: "0",
      kgDisponible: sugerencia?.kgDisponible ?? 0,
      unidadMedida: uePendiente.unidadMedida,
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
      propuestaSistema: { producto: null, fuente: null },
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
