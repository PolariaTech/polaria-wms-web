"use client";

import { Package } from "lucide-react";
import { formatKgEs, formatPrecioEs } from "@/lib/utils/decimal-es";
import type { OrdenVentaDetalleRow } from "@/modules/sales/shared/types/sales.types";
import {
  formatOrdenVentaLineaTotal,
  resolveOrdenVentaLineaTitulo,
  sumOrdenVentaCantidadKg,
  sumOrdenVentaTotal,
} from "@/modules/sales/ordenes/utils/orden-venta-display";
import { JefeBodegaModalSection } from "./jefe-bodega-modal-ui";

interface JefeBodegaSalidaProductosSectionProps {
  orden: OrdenVentaDetalleRow | null;
  loading?: boolean;
}

export function JefeBodegaSalidaProductosSection({
  orden,
  loading = false,
}: JefeBodegaSalidaProductosSectionProps) {
  const lineas = orden?.lineas ?? [];

  return (
    <JefeBodegaModalSection icon={Package} label="Productos de la venta">
      {loading ? (
        <p className="polaria-text-body-sm text-polaria-w-50">
          Cargando productos…
        </p>
      ) : !orden ? (
        <p className="polaria-text-body-sm text-polaria-w-50">
          Selecciona una orden de venta para ver los productos.
        </p>
      ) : lineas.length === 0 ? (
        <p className="polaria-text-body-sm text-polaria-w-50">
          La orden no tiene líneas registradas.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-polaria-w-08">
          <table className="w-full border-collapse text-left">
            <thead className="bg-polaria-t-08">
              <tr className="border-b border-polaria-t-20">
                <th className="px-3 py-2 polaria-text-caption font-medium text-polaria-w-50">
                  Producto
                </th>
                <th className="px-3 py-2 polaria-text-caption font-medium text-polaria-w-50">
                  Cantidad
                </th>
                <th className="px-3 py-2 polaria-text-caption font-medium text-polaria-w-50">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {lineas.map((linea) => (
                <tr
                  key={linea.id_linea_orden_venta}
                  className="border-b border-polaria-w-08 last:border-b-0"
                >
                  <td className="px-3 py-2 polaria-text-body-sm text-polaria-w">
                    {resolveOrdenVentaLineaTitulo(linea)}
                  </td>
                  <td className="px-3 py-2 polaria-text-body-sm whitespace-nowrap text-polaria-w-50">
                    {formatKgEs(linea.cantidad_pedida)} kg
                  </td>
                  <td className="px-3 py-2 polaria-text-body-sm whitespace-nowrap text-polaria-w">
                    ${formatPrecioEs(formatOrdenVentaLineaTotal(linea))}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-polaria-t-08">
              <tr>
                <td
                  colSpan={3}
                  className="px-3 py-2.5 polaria-text-body-sm font-medium text-polaria-w"
                >
                  Total venta: {formatKgEs(sumOrdenVentaCantidadKg(orden))} kg ·
                  ${formatPrecioEs(sumOrdenVentaTotal(orden))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </JefeBodegaModalSection>
  );
}
