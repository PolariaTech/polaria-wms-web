import type { OrdenVentaDetalleRow } from "@/modules/sales/shared/types/sales.types";

export interface SalidaOrdenVentaProducto {
  idProducto: string;
  cantidad: number;
}

export function resolveSalidaProductoDesdeOrden(
  orden: OrdenVentaDetalleRow | null,
): SalidaOrdenVentaProducto | null {
  const lineas = orden?.lineas ?? [];
  if (lineas.length === 0) return null;

  if (lineas.length === 1) {
    const linea = lineas[0]!;
    const cantidad = Number(linea.cantidad_pedida);
    if (!linea.id_producto || !Number.isFinite(cantidad) || cantidad <= 0) {
      return null;
    }
    return { idProducto: linea.id_producto, cantidad };
  }

  const productoIds = new Set(lineas.map((linea) => linea.id_producto));
  if (productoIds.size === 1) {
    const idProducto = lineas[0]!.id_producto;
    const cantidad = lineas.reduce(
      (sum, linea) => sum + Number(linea.cantidad_pedida),
      0,
    );
    if (!idProducto || !Number.isFinite(cantidad) || cantidad <= 0) {
      return null;
    }
    return { idProducto, cantidad };
  }

  const linea = lineas[0]!;
  const cantidad = Number(linea.cantidad_pedida);
  if (!linea.id_producto || !Number.isFinite(cantidad) || cantidad <= 0) {
    return null;
  }
  return { idProducto: linea.id_producto, cantidad };
}
