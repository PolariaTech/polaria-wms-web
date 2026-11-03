import { formatPrecioEs } from "@/lib/utils/decimal-es";
import type { OrdenVentaLineaRow } from "../../../shared/types/sales.types";
import { resolveSkuVisible } from "../../utils/display/resolve-sku-visible";
import {
  formatOrdenVentaCantidadConUnidad,
  resolveOrdenVentaLineaUnidad,
} from "../../utils/display/orden-venta-display";
import type { OrdenTrabajoHija } from "../../utils/origen/origen-correo-ordenes-trabajo";

export type FilaProductoDetalle = {
  linea: OrdenVentaLineaRow;
  titulo: string;
  especificacion: string;
  descuentoPct: number;
  ivaPct: number;
  importe: number;
};

export function OrdenVentaDetalleProductos({
  filas,
  hija,
  cantidadTexto,
  subtotal,
  descuentos,
  iva,
  total,
  mostrarTotalOv,
  totalOv,
}: {
  filas: FilaProductoDetalle[];
  hija: OrdenTrabajoHija | null;
  cantidadTexto: string;
  subtotal: number;
  descuentos: number;
  iva: number;
  total: number;
  mostrarTotalOv: boolean;
  totalOv: number;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-polaria-w-08">
      <table className="w-full table-fixed border-collapse text-left">
        <colgroup>
          <col className="w-[26%]" />
          <col className="w-[18%]" />
          <col className="w-[13%]" />
          <col className="w-[9%]" />
          <col className="w-[12%]" />
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
              Desc%
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
                  {row.descuentoPct}
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
        <p className="polaria-text-caption text-polaria-w-50">
          {filas.length === 1 ? "1 producto" : `${filas.length} productos`} ·{" "}
          {cantidadTexto}
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
              <td className="pr-6 polaria-text-body-sm text-polaria-w-50">
                Descuentos
              </td>
              <td className="font-mono polaria-text-body-sm text-polaria-w">
                ${formatPrecioEs(descuentos)}
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
                {mostrarTotalOv ? "Total OT" : "Total"}
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
