"use client";

import { Package } from "lucide-react";
import { formatKgEs } from "@/lib/utils/decimal-es";
import type { OrdenVentaDetalleRow } from "@/modules/sales";
import { lineaProductoLabel } from "./transporte-entrega.helpers";

interface TransporteEntregaPasoProductosProps {
  lineas: OrdenVentaDetalleRow["lineas"];
  lineaVerificada: Record<number, boolean>;
  cantidades: Record<number, string>;
  onToggleLinea: (index: number, checked: boolean) => void;
  onChangeCantidad: (index: number, value: string) => void;
}

export function TransporteEntregaPasoProductos({
  lineas,
  lineaVerificada,
  cantidades,
  onToggleLinea,
  onChangeCantidad,
}: TransporteEntregaPasoProductosProps) {
  return (
    <section className="rounded-xl border border-polaria-t-20 bg-polaria-t-08 p-3">
      <p className="mb-1 flex items-center gap-2 polaria-text-caption font-semibold uppercase tracking-wide text-polaria-teal">
        <Package className="h-4 w-4" aria-hidden />
        Verificar productos
      </p>
      <p className="mb-3 polaria-text-caption text-polaria-w-50">
        Marcá cada ítem como verificado e indicá la cantidad entregada.
      </p>
      <ul className="space-y-3">
        {lineas.map((linea, index) => (
          <li
            key={linea.id_linea_orden_venta}
            className="rounded-xl border border-polaria-w-08 bg-polaria-bg/40 px-3 py-3"
          >
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={Boolean(lineaVerificada[index])}
                onChange={(event) =>
                  onToggleLinea(index, event.target.checked)
                }
                className="mt-1 h-4 w-4 accent-polaria-teal"
              />
              <span className="min-w-0 flex-1 polaria-text-body-sm font-medium text-polaria-w">
                {lineaProductoLabel(linea)}
              </span>
            </label>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-polaria-w-08 pt-3">
              <span className="polaria-text-caption text-polaria-w-50">
                Pedido:{" "}
                <strong className="text-polaria-w">
                  {formatKgEs(linea.cantidad_pedida)} kg
                </strong>
              </span>
              <label className="flex items-center gap-2 polaria-text-caption text-polaria-w-50">
                Entregada
                <input
                  type="number"
                  min={0}
                  step="any"
                  inputMode="decimal"
                  value={cantidades[index] ?? ""}
                  onChange={(event) =>
                    onChangeCantidad(index, event.target.value)
                  }
                  className="w-24 rounded-lg border border-polaria-w-08 bg-polaria-w-08 px-2 py-1.5 text-right polaria-text-body-sm font-semibold text-polaria-w outline-none focus:border-polaria-t-20 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </label>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
