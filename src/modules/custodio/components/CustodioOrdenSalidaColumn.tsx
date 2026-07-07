"use client";

import { ArrowRightFromLine, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { OrdenVentaOperadorRow } from "@/modules/sales";
import { CustodioSidePanel } from "./CustodioSidePanel";

interface CustodioOrdenSalidaColumnProps {
  ventas: OrdenVentaOperadorRow[];
  cajasEnSalida: number;
  selectedVentaId: string;
  onSelectVenta: (id: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  slotSize: number;
}

export function CustodioOrdenSalidaColumn({
  ventas,
  cajasEnSalida,
  selectedVentaId,
  onSelectVenta,
  onRefresh,
  isLoading,
  slotSize,
}: CustodioOrdenSalidaColumnProps) {
  const ventasActivas = ventas.filter((venta) =>
    ["confirmada", "en_preparacion", "parcialmente_despachada"].includes(
      venta.estado,
    ),
  );

  return (
    <CustodioSidePanel
      slotSize={slotSize}
      panelClassName="polaria-card-glow border-polaria-t-20 bg-polaria-t-08"
      className="h-full min-h-0"
    >
      <header className="mb-2 flex w-full shrink-0 flex-row flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 shrink items-center gap-2">
          <ArrowRightFromLine
            className="h-4 w-4 shrink-0 text-polaria-teal"
            strokeWidth={1.75}
            aria-hidden
          />
          <h2 className="truncate polaria-text-body-sm font-semibold text-polaria-w">
            Orden de salida
          </h2>
        </div>
        <span className="rounded-full border border-polaria-t-20 bg-polaria-t-08 px-2.5 py-0.5 polaria-text-caption text-polaria-w">
          {cajasEnSalida} cajas
        </span>
      </header>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full border border-polaria-t-20 bg-polaria-t-08 px-2.5 py-0.5 polaria-text-caption text-polaria-teal">
          {ventasActivas.length} ventas
        </span>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-2 py-1",
            "polaria-text-caption text-polaria-w-50 transition hover:text-polaria-teal",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          <RefreshCw
            className={cn("h-3.5 w-3.5", isLoading && "animate-spin")}
            aria-hidden
          />
          Actualizar
        </button>
      </div>

      <p className="polaria-text-caption text-polaria-w-50">
        Ventas para el mismo camión.{" "}
        {ventasActivas.length === 0
          ? "No hay ventas en curso con cajas en salida."
          : "Seleccioná una o más ventas del mismo camión."}
      </p>

      <div className="mt-3 flex min-h-0 flex-1 flex-col gap-3">
        <label className="polaria-text-caption text-polaria-w-50">
          Venta para detalle y registro línea a línea
        </label>
        <select
          value={selectedVentaId}
          onChange={(event) => onSelectVenta(event.target.value)}
          disabled={isLoading || ventasActivas.length === 0}
          className={cn(
            "w-full rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-3 py-2.5",
            "polaria-text-body-sm text-polaria-w",
            "focus:border-polaria-t-20 focus:outline-none focus:ring-1 focus:ring-polaria-t-20",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          <option value="">
            {isLoading ? "Cargando ventas…" : "Elegí una venta (opcional)"}
          </option>
          {ventasActivas.map((venta) => (
            <option key={venta.idOrdenVenta} value={venta.idOrdenVenta}>
              {venta.venta} — {venta.comprador}
            </option>
          ))}
        </select>

        <div className="rounded-xl border border-polaria-t-20 bg-polaria-w-08 p-3">
          <p className="polaria-text-caption font-semibold uppercase tracking-wide text-polaria-teal">
            Paquete de despacho
          </p>
          <p className="mt-2 polaria-text-caption text-polaria-w-50">
            {selectedVentaId
              ? "Venta seleccionada. Próximamente podrás armar el paquete línea a línea."
              : "Marcá al menos una venta arriba para armar el paquete (mismo camión para todas)."}
          </p>
        </div>
      </div>

      <p className="mt-auto w-full shrink-0 pt-2 polaria-text-caption text-polaria-w-20">
        Seleccioná ventas del mismo camión o registrá la salida línea a línea
        desde el detalle de cada venta.
      </p>
    </CustodioSidePanel>
  );
}
