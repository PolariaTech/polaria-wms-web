import {
  formatDecimalInputEs,
  formatPrecioInputMx,
  parseDecimalEs,
} from "@/lib/utils/decimal-es";
import { stripLeadingProductoCodigo } from "../../../shared/utils/producto-venta-nombre";
import { UNIDAD_MEDIDA_VENTA_DEFAULT } from "../../../shared/types/sales.types";
import type { OrdenVentaLineaRow } from "../../../shared/types/sales.types";
import { notaCapturaForLinea } from "./build-orden-venta-captura-observaciones";
import { assignOtIdsToFormLineas } from "../ot/filter-lineas-by-orden-trabajo";
import {
  resolveSkuVisible,
  resolveTextoProductoOrigen,
} from "../display/resolve-sku-visible";
import { resolveOrdenVentaLineaTitulo } from "../display/orden-venta-display";
import type {
  OrigenCorreoRenglon,
  OrdenTrabajoHija,
} from "../origen/origen-correo-ordenes-trabajo";

type ProductoCatalogo = {
  idProducto: string;
  codigo: string;
  nombre: string;
  idBodega: string;
  kgDisponible: number;
  unidadMedida: string;
};

/**
 * REQ-195: líneas del formulario desde BD (OV materializada), con otId.
 */
export function mapDetalleLineasAForm(params: {
  detalleLineas: readonly OrdenVentaLineaRow[];
  productoRows: readonly ProductoCatalogo[];
  origenCorreoRows: readonly OrigenCorreoRenglon[];
  idBodegaDetalle: string;
  notasLineas: string;
  hijas: readonly OrdenTrabajoHija[];
}) {
  const {
    detalleLineas,
    productoRows,
    origenCorreoRows,
    idBodegaDetalle,
    notasLineas,
    hijas,
  } = params;

  const lineasEditBase = detalleLineas.map((linea) => {
    const catalogo = productoRows.find(
      (row) => row.idProducto === linea.id_producto,
    );
    const skuFromOrigen = resolveSkuVisible({
      linea,
      origenRenglones: origenCorreoRows,
    });
    const skuRaw = linea.producto?.sku?.trim() || "";
    const skuUsable =
      skuRaw && !skuRaw.toUpperCase().startsWith("ARCH-") ? skuRaw : "";
    const codigo = catalogo?.codigo || skuUsable || skuFromOrigen || "";
    const nombreRaw =
      catalogo?.nombre || resolveOrdenVentaLineaTitulo(linea);
    const nombre = stripLeadingProductoCodigo(nombreRaw, codigo);
    const aliasCliente =
      resolveTextoProductoOrigen({
        linea,
        origenRenglones: origenCorreoRows,
      }) || undefined;
    return {
      idProducto: linea.id_producto,
      nombre,
      codigo,
      idBodega: catalogo?.idBodega || idBodegaDetalle,
      cantidadInput: formatDecimalInputEs(linea.cantidad_pedida),
      cajasInput:
        linea.cajas != null && linea.cajas > 0
          ? formatDecimalInputEs(linea.cajas)
          : "",
      presentacion: linea.presentacion?.trim() || "",
      especificacion: "",
      descuentoPctInput: "",
      ivaPct: "0",
      kgDisponible: catalogo?.kgDisponible ?? 0,
      unidadMedida:
        linea.unidad_medida?.trim() ||
        catalogo?.unidadMedida ||
        UNIDAD_MEDIDA_VENTA_DEFAULT,
      precioUnitario: linea.precio_unitario,
      precioInput: formatPrecioInputMx(linea.precio_unitario),
      precioManual: true as const,
      aliasCliente,
      // REQ-201: línea ya en BD = producto verificado (no volver a pedir match).
      catalogPending: false,
      catalogAmbiguo: false,
      sugerencia: null,
      sugerenciasAlternativas: [] as Array<{
        idProducto: string;
        nombre: string;
        codigo: string;
        idBodega: string;
        kgDisponible: number;
        unidadMedida: string;
        precioUnitario: number;
      }>,
    };
  });

  const lineasConOt = assignOtIdsToFormLineas(
    lineasEditBase,
    hijas,
    (raw) => parseDecimalEs(raw) ?? 0,
  );

  return lineasConOt.map((linea) => ({
    ...linea,
    especificacion: notaCapturaForLinea(notasLineas, {
      nombre: linea.nombre,
      cantidad: parseDecimalEs(linea.cantidadInput) ?? 0,
      otId: linea.otId,
      idProducto: linea.idProducto || null,
      allowUnscoped:
        !linea.otId &&
        lineasConOt.filter((l) => l.nombre === linea.nombre).length === 1,
    }),
  }));
}

export function ovTieneLineasMaterializadas(
  detalleLineas: readonly { id_producto?: string | null }[],
): boolean {
  return detalleLineas.some((linea) => Boolean(linea.id_producto?.trim()));
}
