import type { ProductoVentaOption } from "@/modules/sales/shared/types/sales.types";
import { UNIDAD_MEDIDA_VENTA_DEFAULT } from "@/modules/sales/shared/types/sales.types";
import { stripLeadingProductoCodigo } from "@/modules/sales/shared/utils/producto-venta-nombre";
import { formatPrecioInputMx } from "@/lib/utils/decimal-es";
import type { OrigenCorreoRenglon } from "../origen/origen-correo-ordenes-trabajo";
import { indexIdProductoVerificadoOrigen } from "../origen/origen-correo-id-producto-verificado";

export type LineaParaVerificacionOrigen = {
  idProducto: string;
  nombre: string;
  codigo: string;
  idBodega: string;
  kgDisponible: number;
  unidadMedida: string;
  precioUnitario: number;
  precioInput: string;
  precioManual?: boolean;
  aliasCliente?: string;
  otId?: string;
  catalogPending?: boolean;
  catalogAmbiguo?: boolean;
  sugerencia?: unknown;
  sugerenciasAlternativas?: unknown[];
  filledByIa?: boolean;
};

function formatPrecioInput(value: number): string {
  if (!Number.isFinite(value) || value === 0) return "";
  return formatPrecioInputMx(value);
}

function applyProductoToLinea<T extends LineaParaVerificacionOrigen>(
  linea: T,
  row: ProductoVentaOption,
): T {
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

/** REQ-201: reaplica verificaciones guardadas en origen_correo._idProducto. */
export function applyVerificacionesOrigenALineas<
  T extends LineaParaVerificacionOrigen,
>(
  lineas: T[],
  origenRows: readonly OrigenCorreoRenglon[],
  productos: ProductoVentaOption[],
): T[] {
  const verified = indexIdProductoVerificadoOrigen(origenRows);
  if (verified.size === 0) return lineas;
  const perOt = new Map<string, number>();
  return lineas.map((linea) => {
    if (linea.idProducto && !linea.catalogPending) return linea;
    const otKey = linea.otId?.trim() || "default";
    const idx = perOt.get(otKey) ?? 0;
    perOt.set(otKey, idx + 1);
    const idProducto =
      verified.get(`${otKey}#${idx}`) ||
      (linea.idProducto
        ? verified.get(`${otKey}#id:${linea.idProducto}`)
        : undefined);
    if (!idProducto) return linea;
    const catalogo = productos.find((p) => p.idProducto === idProducto);
    if (!catalogo) {
      return {
        ...linea,
        idProducto,
        catalogPending: false,
        catalogAmbiguo: false,
        sugerencia: null,
        sugerenciasAlternativas: [],
        filledByIa: false,
      };
    }
    return applyProductoToLinea(
      { ...linea, aliasCliente: linea.aliasCliente || linea.nombre },
      catalogo,
    );
  });
}
