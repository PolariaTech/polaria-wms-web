import type { PedidoExtraido } from "../ai/openai-pedido.client";
import type { ProductoVentaOption } from "../../shared/types/sales.types";
import { stripLeadingProductoCodigo } from "../../shared/utils/producto-venta-nombre";
import { formatCapturaFecha } from "./build-orden-venta-captura-observaciones";
import {
  aplicarEmpaqueInicialLinea,
  collectMissingFieldsDocs,
  type CampoOperativoDocs,
} from "./empaque-lineas";
import { groupKeyOrigenCorreo } from "./origen-correo-ordenes-trabajo";
import {
  FECHA_ENTREGA_ATRASADA_WARNING,
  isFechaEntregaAtrasada,
} from "./pedido-form-validation";

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

function parsePrecioIa(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value) || value <= 0) return null;
  return value;
}

/** Solo clave exacta de catálogo "NOMBRE (SKU)" — sin fuzzy (evita productos equivocados). */
function resolveProductoMatch(
  linea: {
    productoCatalogo: string | null;
  },
  byKey: Map<string, ProductoVentaOption>,
): ProductoVentaOption | undefined {
  if (!linea.productoCatalogo) return undefined;
  return byKey.get(linea.productoCatalogo);
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
 * Traduce PedidoExtraido al estado del modal, respetando:
 * ficha del cliente primero en datos de comprador; dirección de entrega
 * prioriza la solicitud y solo cae a ficha si el pedido no trae dirección.
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
  compareOverride({
    fieldKey: "direccion",
    label: "Dirección de entrega",
    valorDb: ficha.direccion,
    valorIa: pedido.direccion,
    patch,
    autoFields,
    warnFields,
    discrepancias,
    // La solicitud manda: si el pedido trae dirección, se usa esa; si no, la de ficha.
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
    preferFicha: true,
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
    preferFicha: true,
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
    preferFicha: true,
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
    preferFicha: true,
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
    preferFicha: true,
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

  // Observaciones del formulario = ficha del comprador, salvo que la IA
  // haya extraído especificaciones cortas para notas generales de almacén.
  if (pedido.notasGeneralesAlmacen?.trim()) {
    patch.observaciones = pedido.notasGeneralesAlmacen.trim();
  }

  const byKey = new Map(
    productos.map((p) => [catalogKey(p.nombre, p.codigo), p] as const),
  );

  const lineas: LineaVentaFromIa[] = [];

  for (const linea of pedido.lineas) {
    const match = resolveProductoMatch(linea, byKey);
    if (!match) {
      continue;
    }

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
    const precioUnitario = precioDoc ?? match.precioUnitario;
    const otId = groupKeyOrigenCorreo({
      "Numero pedido": linea.numeroPedido || pedido.ordenCompraHotel || "",
      Almacen: linea.almacen || pedido.centroConsumo || "",
      "Referencia pedido": linea.referenciaPedido || "",
    });

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
      aliasCliente: linea.textoOriginal?.trim() || "",
      filledByIa: true,
      otId,
      packHint: empaque.packHint,
      autoPackFields: empaque.autoPackFields,
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
