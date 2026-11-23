import type { OrdenVentaLineaRow } from "../../../shared/types/sales.types";
import { notaCapturaForLinea } from "../../utils/pedido/build-orden-venta-captura-observaciones";
import { resolveOrdenVentaLineaTitulo } from "../../utils/display/orden-venta-display";
import type { OrdenTrabajoHija } from "../../utils/origen/origen-correo-ordenes-trabajo";
import { montoDeNota, totalLineaConIva } from "./detalle-venta-presentacion";

type NotasLineas = Parameters<typeof notaCapturaForLinea>[0];

export interface CalcularMontosDetalleArgs {
  /** Líneas ya filtradas por la OT activa. */
  lineItems: OrdenVentaLineaRow[];
  /** Todas las líneas de la OV (para el total global). */
  todasLineas: OrdenVentaLineaRow[];
  notasLineas: NotasLineas;
  hija: OrdenTrabajoHija | null;
}

/** Montos por renglón de la OT activa y totales de la OT y de la OV completa. */
export function calcularMontosDetalle({
  lineItems,
  todasLineas,
  notasLineas,
  hija,
}: CalcularMontosDetalleArgs) {
  const montosLinea = lineItems.map((linea) => {
    const titulo = resolveOrdenVentaLineaTitulo(linea);
    const nota = notaCapturaForLinea(notasLineas, {
      nombre: titulo,
      cantidad: linea.cantidad_pedida,
      otId: hija?.id,
      idProducto: linea.id_producto,
      allowUnscoped: !hija,
    });
    return {
      linea,
      titulo,
      ...montoDeNota(nota, linea.cantidad_pedida, linea.precio_unitario),
    };
  });
  const subtotalOt = montosLinea.reduce((sum, row) => sum + row.bruto, 0);
  const ivaOt = montosLinea.reduce((sum, row) => sum + row.iva, 0);
  const totalOt = Math.max(0, subtotalOt + ivaOt);
  const totalOv = todasLineas.reduce((sum, linea) => {
    const nota = notaCapturaForLinea(notasLineas, {
      nombre: resolveOrdenVentaLineaTitulo(linea),
      cantidad: linea.cantidad_pedida,
      idProducto: linea.id_producto,
      allowUnscoped: true,
    });
    return sum + totalLineaConIva(linea.cantidad_pedida, linea.precio_unitario, nota);
  }, 0);
  return { montosLinea, subtotalOt, ivaOt, totalOt, totalOv };
}
