import { formatPrecioInputMx, parseDecimalEs } from "@/lib/utils/decimal-es";
import { UNIDAD_MEDIDA_VENTA_DEFAULT } from "@/modules/sales/shared/types/sales.types";
import type { mapPedidoExtraidoToForm } from "../../utils/pedido/map-pedido-extraido-to-form";

export interface LineaSugerenciaCatalogo {
  idProducto: string;
  nombre: string;
  codigo: string;
  idBodega: string;
  kgDisponible: number;
  unidadMedida: string;
  precioUnitario: number;
}

export interface LineaVentaForm {
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
  precioInput: string;
  precioManual?: boolean;
  aliasCliente?: string;
  filledByIa?: boolean;
  otId?: string;
  catalogPending?: boolean;
  catalogAmbiguo?: boolean;
  sugerencia?: LineaSugerenciaCatalogo | null;
  sugerenciasAlternativas?: LineaSugerenciaCatalogo[];
}

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

function formatPrecioInput(value: number): string {
  if (!Number.isFinite(value) || value === 0) return "";
  return formatPrecioInputMx(value);
}

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
    descuentoPctInput: linea.descuentoPctInput,
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
