import { formatPrecioEs } from "@/lib/utils/decimal-es";
import type { OrdenVentaLineaRow } from "../../../shared/types/sales.types";
import { resolveSkuVisible } from "../../utils/display/resolve-sku-visible";
import {
  formatOrdenVentaCantidadConUnidad,
  resolveOrdenVentaLineaUnidad,
} from "../../utils/display/orden-venta-display";
import type { OrdenTrabajoHija } from "../../utils/origen/origen-correo-ordenes-trabajo";
import { textoConteoProductos } from "./detalle-venta-presentacion";
import { ETIQUETA_TAREA } from "./etiqueta-tarea-ot";

export type FilaProductoDetalle = {
  linea: OrdenVentaLineaRow;
  titulo: string;
  especificacion: string;
  ivaPct: number;
  importe: number;
};

/** REQ-218: sin columna Desc% ni pie Descuentos (consistente con edición). */
export function OrdenVentaDetalleProductos({
  filas,
  hija,
  subtotal,
  iva,
  total,
  mostrarTotalOv,
  totalOv,
}: {
  filas: FilaProductoDetalle[];
  hija: OrdenTrabajoHija | null;
  subtotal: number;
  iva: number;
  total: number;
  mostrarTotalOv: boolean;
  totalOv: number;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-polaria-w-08">
      <table className="w-full table-fixed border-collapse text-left">
        <colgroup>
          <col className="w-[28%]" />
          <col className="w-[22%]" />
          <col className="w-[14%]" />
          <col className="w-[14%]" />
          <col className="w-[10%]" />
          <col className="w-[12%]" />
        </colgroup>
        <thead className="bg-polaria-w-08">
          <tr className="border-b border-polaria-t-20">
            <th className="px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50">
              Producto
            </th>
            <th className="px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50">
              Especificación
            </th>
            <th className="px-3 py-2.5 text-right polaria-text-caption font-medium text-polaria-w-50">
              Cantidad
            </th>
            <th className="px-3 py-2.5 text-right polaria-text-caption font-medium text-polaria-w-50">
              Precio
            </th>
            <th className="px-3 py-2.5 text-right polaria-text-caption font-medium text-polaria-w-50">
              IVA
            </th>
            <th className="px-3 py-2.5 text-right polaria-text-caption font-medium text-polaria-w-50">
              Importe
            </th>
          </tr>
        </thead>
        <tbody>
          {filas.map((row) => {
            const skuVisible = resolveSkuVisible({
              linea: row.linea,
              origenRenglones: hija?.renglones ?? undefined,
              hija,
            });
            return (
              <tr
                key={row.linea.id_linea_orden_venta}
                className="border-b border-polaria-w-08 last:border-b-0"
              >
                <td className="px-3 py-2.5 align-middle">
                  <p className="polaria-text-body-sm font-medium text-polaria-w">
                    {row.titulo}
                  </p>
                  <p className="polaria-text-caption text-polaria-w-50">
                    {skuVisible
                      ? `SKU ${skuVisible}`
                      : resolveOrdenVentaLineaUnidad(row.linea)}
                  </p>
                </td>
                <td className="px-3 py-2.5 align-middle polaria-text-body-sm text-polaria-w">
                  {row.especificacion ? (
                    <span className="break-words">{row.especificacion}</span>
                  ) : (
                    <span className="text-polaria-w-50">—</span>
                  )}
                </td>
                <td className="px-3 py-2.5 align-middle text-right polaria-text-body-sm text-polaria-w">
                  {formatOrdenVentaCantidadConUnidad(
                    row.linea.cantidad_pedida,
                    resolveOrdenVentaLineaUnidad(row.linea),
                  )}
                </td>
                <td className="px-3 py-2.5 align-middle text-right polaria-text-body-sm text-polaria-w">
                  ${formatPrecioEs(row.linea.precio_unitario)}
                </td>
                <td className="px-3 py-2.5 align-middle text-right polaria-text-body-sm text-polaria-w">
                  {row.ivaPct}
                </td>
                <td className="px-3 py-2.5 align-middle text-right polaria-text-body-sm font-medium text-polaria-teal">
                  ${formatPrecioEs(row.importe)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="flex items-start justify-between gap-4 border-t border-polaria-t-20 bg-polaria-w-08 px-3 py-2">
        {/* REQ-224: solo conteo de productos, sin unidad/kg */}
        <p className="polaria-text-caption text-polaria-w-50">
          {textoConteoProductos(filas.length)}
        </p>
        <table className="text-right">
          <tbody>
            <tr>
              <td className="pr-6 polaria-text-body-sm text-polaria-w-50">
                Subtotal
              </td>
              <td className="font-mono polaria-text-body-sm text-polaria-w">
                ${formatPrecioEs(subtotal)}
              </td>
            </tr>
            <tr>
              <td className="pr-6 polaria-text-body-sm text-polaria-w-50">IVA</td>
              <td className="font-mono polaria-text-body-sm text-polaria-w">
                ${formatPrecioEs(iva)}
              </td>
            </tr>
            <tr>
              <td className="pt-1 pr-6 polaria-text-body-sm font-semibold text-polaria-w">
                {mostrarTotalOv ? `Total ${ETIQUETA_TAREA}` : "Total"}
              </td>
              <td className="pt-1 font-mono polaria-text-body-sm font-semibold text-polaria-teal">
                ${formatPrecioEs(total)}
              </td>
            </tr>
            {mostrarTotalOv ? (
              <tr>
                <td className="pt-1 pr-6 polaria-text-body-sm font-semibold text-polaria-w">
                  Total OV
                </td>
                <td className="pt-1 font-mono polaria-text-body-sm font-semibold text-polaria-teal">
                  ${formatPrecioEs(totalOv)}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
