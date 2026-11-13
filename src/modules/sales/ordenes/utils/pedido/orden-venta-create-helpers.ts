import type { CompradorListRow } from "@/modules/admin-panel";
import {
  formatPrecioInputMx,
  parseDecimalEs,
} from "@/lib/utils/decimal-es";
import { stripLeadingProductoCodigo } from "../../../shared/utils/producto-venta-nombre";
import {
  UNIDAD_MEDIDA_VENTA_DEFAULT,
  type ProductoVentaOption,
} from "../../../shared/types/sales.types";
import { rankProductosCatalogo } from "../match/find-closest-producto-catalogo";
import { parseFechaOrigen } from "../origen/materialize-ov-desde-origen";
import { mapPedidoExtraidoToForm } from "./map-pedido-extraido-to-form";
import type {
  BodegaDestinoOption,
  LineaSugerenciaCatalogo,
  LineaVentaForm,
} from "../../types/orden-venta-create-modal.types";

export function formatProductoNombreConSku(
  nombre: string,
  codigo: string,
): string {
  const name = nombre.trim();
  const sku = codigo.trim();
  if (!name) return sku && sku !== "—" ? `(${sku})` : "";
  if (!sku || sku === "—") return name;
  if (name.toLowerCase().includes(`(${sku.toLowerCase()})`)) return name;
  return `${name} (${sku})`;
}

export function collectSugerenciasLinea(
  linea: LineaVentaForm,
): LineaSugerenciaCatalogo[] {
  const out: LineaSugerenciaCatalogo[] = [];
  const seen = new Set<string>();
  for (const sug of [
    linea.sugerencia,
    ...(linea.sugerenciasAlternativas ?? []),
  ]) {
    if (!sug?.idProducto || seen.has(sug.idProducto)) continue;
    seen.add(sug.idProducto);
    out.push(sug);
  }
  return out;
}

export function formatPrecioInput(value: number): string {
  if (!Number.isFinite(value) || value === 0) return "";
  return formatPrecioInputMx(value);
}

/** Línea del formulario a partir de la que arma `mapPedidoExtraidoToForm`. */
export function lineaFormDesdeIa(
  linea: ReturnType<typeof mapPedidoExtraidoToForm>["lineas"][number],
): LineaVentaForm {
  return {
    idProducto: linea.idProducto,
    nombre: linea.nombre,
    codigo: linea.codigo,
    idBodega: linea.idBodega,
    cantidadInput: linea.cantidadInput,
    cajasInput: linea.cajasInput,
    presentacion: linea.presentacion,
    especificacion: linea.especificacion,
    ivaPct: "0",
    kgDisponible: linea.kgDisponible,
    unidadMedida: linea.unidadMedida || UNIDAD_MEDIDA_VENTA_DEFAULT,
    precioUnitario: linea.precioUnitario,
    precioInput: formatPrecioInput(linea.precioUnitario),
    precioManual: linea.precioManual,
    aliasCliente: linea.aliasCliente,
    filledByIa: linea.filledByIa,
    otId: linea.otId,
    catalogPending: linea.catalogPending,
    catalogAmbiguo: linea.catalogAmbiguo,
    sugerencia: linea.sugerencia ?? null,
    sugerenciasAlternativas: linea.sugerenciasAlternativas ?? [],
  };
}

export const parseCantidadReagrupacion = (raw: string): number =>
  parseDecimalEs(raw) ?? 0;

export function fieldControlClass(params: {
  field?: string;
  autoFields?: Set<string>;
  warnFields?: Set<string>;
  missingFields?: Set<string>;
  missing?: boolean;
}): string | undefined {
  const { field, autoFields, warnFields, missingFields, missing } = params;
  if (missing || (field && missingFields?.has(field))) {
    return "!border-polaria-danger-border !bg-polaria-danger-bg";
  }
  if (field && warnFields?.has(field)) {
    return "!border-polaria-warning-border !bg-polaria-warning-bg";
  }
  if (field && autoFields?.has(field)) {
    return "!border-polaria-teal/50 !bg-polaria-t-08";
  }
  return undefined;
}

/** REQ-218: sin descuento; importe = bruto. */
export function lineAmounts(linea: LineaVentaForm): {
  bruto: number;
  base: number;
  iva: number;
  importe: number;
} {
  const cantidad = parseDecimalEs(linea.cantidadInput) ?? 0;
  const bruto = Math.max(0, cantidad) * linea.precioUnitario;
  const ivaPct = Math.max(0, Number(linea.ivaPct) || 0);
  const iva = bruto * (ivaPct / 100);
  return { bruto, base: bruto, iva, importe: bruto };
}

export function formatCompradorLabel(row: CompradorListRow): string {
  return row.comprador.trim();
}

export function formatBodegaDestinoOption(
  bodega: { idBodega: string; nombre: string; codigo: string },
  tipo: "interna" | "externa",
  incluirTipo: boolean,
): BodegaDestinoOption {
  const base = `${bodega.nombre} (${bodega.codigo})`;
  return {
    idBodega: bodega.idBodega,
    label: incluirTipo
      ? `${base} · ${tipo === "interna" ? "interna" : "externa"}`
      : base,
  };
}

export function resolveBodegaDestinoInicial(
  destinoRows: BodegaDestinoOption[],
  idBodegaDefault: string | null,
): string {
  if (
    idBodegaDefault &&
    destinoRows.some((row) => row.idBodega === idBodegaDefault)
  ) {
    return idBodegaDefault;
  }
  if (destinoRows.length === 1) {
    return destinoRows[0]!.idBodega;
  }
  return "";
}

export function sugerenciaToOption(
  sug: LineaSugerenciaCatalogo,
): ProductoVentaOption {
  return {
    idProducto: sug.idProducto,
    label: `${sug.nombre} (${sug.codigo})`,
    idCliente: null,
    idBodega: sug.idBodega,
    codigo: sug.codigo,
    nombre: sug.nombre,
    kgDisponible: sug.kgDisponible,
    precioUnitario: sug.precioUnitario,
    unidadMedida: sug.unidadMedida,
  };
}

export function toLineaSugerencia(
  row: ProductoVentaOption,
): LineaSugerenciaCatalogo {
  return {
    idProducto: row.idProducto,
    nombre: row.nombre,
    codigo: row.codigo,
    idBodega: row.idBodega,
    kgDisponible: row.kgDisponible,
    precioUnitario: row.precioUnitario,
    unidadMedida: row.unidadMedida,
  };
}

/** Sugerencias de catálogo para un texto del cliente (Mateo / origen_correo). */
export function suggestFromCatalogo(
  query: string,
  catalogo: readonly ProductoVentaOption[],
): {
  sugerencia: LineaSugerenciaCatalogo | null;
  sugerenciasAlternativas: LineaSugerenciaCatalogo[];
  catalogAmbiguo: boolean;
} {
  const ranked = rankProductosCatalogo(query, catalogo);
  const top = ranked.candidates[0];
  if (!top) {
    return {
      sugerencia: null,
      sugerenciasAlternativas: [],
      catalogAmbiguo: false,
    };
  }
  return {
    sugerencia: toLineaSugerencia(top.producto),
    sugerenciasAlternativas: ranked.candidates
      .slice(1)
      .map((c) => toLineaSugerencia(c.producto)),
    catalogAmbiguo: ranked.ambiguous,
  };
}

export function applyProductoToLinea(
  linea: LineaVentaForm,
  row: ProductoVentaOption,
): LineaVentaForm {
  const keepPrecio =
    Boolean(linea.precioManual) &&
    linea.precioUnitario > 0 &&
    linea.precioInput.trim().length > 0;
  return {
    ...linea,
    idProducto: row.idProducto,
    nombre: stripLeadingProductoCodigo(row.nombre, row.codigo),
    codigo: row.codigo,
    idBodega: row.idBodega,
    kgDisponible: row.kgDisponible,
    unidadMedida: row.unidadMedida || UNIDAD_MEDIDA_VENTA_DEFAULT,
    precioUnitario: keepPrecio ? linea.precioUnitario : row.precioUnitario,
    precioInput: keepPrecio
      ? linea.precioInput
      : formatPrecioInput(row.precioUnitario),
    precioManual: keepPrecio,
    catalogPending: false,
    catalogAmbiguo: false,
    sugerencia: null,
    sugerenciasAlternativas: [],
    filledByIa: false,
  };
}

export function toDateInputValue(value: string | null | undefined): string {
  const raw = value?.trim() ?? "";
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  // BirchStreet / origen: "10/26/2026" → ISO (REQ-098 / REQ-110).
  return parseFechaOrigen(raw) ?? "";
}
