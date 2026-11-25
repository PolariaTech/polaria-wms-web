import { formatPrecioEs } from "@/lib/utils/decimal-es";
import { UNIDAD_MEDIDA_VENTA_DEFAULT } from "../../../shared/types/sales.types";
import { formatOrdenVentaCantidadConUnidad } from "../../utils/display/orden-venta-display";
import type { OrigenCorreoRenglon } from "../../utils/origen/origen-correo-renglon";

/** Número del correo: acepta número o texto con coma decimal; inválido → 0. */
export function numeroDeOrigen(valor: unknown): number {
  if (typeof valor === "number") return valor;
  return Number(String(valor ?? "").replace(",", ".")) || 0;
}

export interface OrdenVentaDetalleOrigenFallbackProps {
  renglones: OrigenCorreoRenglon[];
}

/** Productos leídos del correo que aún no se ligaron al catálogo. */
export function OrdenVentaDetalleOrigenFallback({
  renglones,
}: OrdenVentaDetalleOrigenFallbackProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-polaria-w-08">
      <p className="border-b border-polaria-t-20 bg-polaria-warning-bg/40 px-3 py-2 polaria-text-caption text-polaria-warning">
        Productos del correo (aún sin ligar al catálogo). Se materializan al abrir /
        confirmar la OV.
      </p>
      <table className="w-full table-fixed border-collapse text-left">
        <colgroup>
          <col className="w-[52%]" />
          <col className="w-[24%]" />
          <col className="w-[24%]" />
        </colgroup>
        <thead className="bg-polaria-w-08">
          <tr className="border-b border-polaria-t-20">
            <th className="px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50">
              Producto
            </th>
            <th className="px-3 py-2.5 text-right polaria-text-caption font-medium text-polaria-w-50">
              Cantidad
            </th>
            <th className="px-3 py-2.5 text-right polaria-text-caption font-medium text-polaria-w-50">
              Precio
            </th>
          </tr>
        </thead>
        <tbody>
          {renglones.map((row, index) => {
            const qty = numeroDeOrigen(row.Cantidad);
            const precio = numeroDeOrigen(row.Precio);
            return (
              <tr
                key={`origen-${index}-${row.Producto ?? ""}`}
                className="border-b border-polaria-w-08 last:border-b-0"
              >
                <td className="px-3 py-2.5 align-middle">
                  <p className="polaria-text-body-sm font-medium text-polaria-w">
                    {row.Producto?.trim() || "Producto"}
                  </p>
                  <p className="polaria-text-caption text-polaria-w-50">
                    {row["Codigo producto"]?.trim()
                      ? `Cód. ${row["Codigo producto"]}`
                      : "Del correo"}
                  </p>
                </td>
                <td className="px-3 py-2.5 align-middle text-right polaria-text-body-sm text-polaria-w">
                  {formatOrdenVentaCantidadConUnidad(
                    qty,
                    row.Unidad?.trim() || UNIDAD_MEDIDA_VENTA_DEFAULT,
                  )}
                </td>
                <td className="px-3 py-2.5 align-middle text-right polaria-text-body-sm text-polaria-w">
                  {precio > 0 ? `$${formatPrecioEs(precio)}` : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
