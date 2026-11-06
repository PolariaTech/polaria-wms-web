"use client";

import { cn } from "@/lib/utils/cn";
import {
  ESTADO_ORDEN_VENTA_LABELS,
  ESTADOS_ORDEN_VENTA,
} from "../../../shared/constants/sales-status";
import type { EstadoOrdenVenta } from "../../../shared/types/sales.types";

export function OvEstadoFiltroBar({
  estadoFiltro,
  onChange,
  totalDelDia,
  countsByEstado,
}: {
  estadoFiltro: EstadoOrdenVenta | null;
  onChange: (estado: EstadoOrdenVenta | null) => void;
  totalDelDia: number;
  countsByEstado: Record<EstadoOrdenVenta, number>;
}) {
  return (
    <div
      role="group"
      aria-label="Filtrar por estado"
      className="mb-4 flex w-full gap-2 sm:mb-5 [@media(max-height:50rem)]:mb-2 sm:[@media(max-height:50rem)]:mb-2"
    >
      <button
        type="button"
        aria-pressed={estadoFiltro === null}
        onClick={() => onChange(null)}
        className={cn(
          "flex flex-1 items-center justify-center whitespace-nowrap rounded-xl border px-2.5 py-2 [@media(max-height:50rem)]:py-1 text-sm font-semibold transition",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
          estadoFiltro === null
            ? "border-polaria-teal bg-polaria-teal text-polaria-on-teal"
            : "border-polaria-t-20 bg-polaria-t-08 text-polaria-w hover:border-polaria-teal hover:bg-polaria-t-20",
        )}
      >
        Todos
        <span
          className={cn(
            "ml-1.5 tabular-nums",
            estadoFiltro === null
              ? "text-polaria-on-teal/80"
              : "text-polaria-w-50",
          )}
        >
          {totalDelDia}
        </span>
      </button>
      {ESTADOS_ORDEN_VENTA.map((estado) => {
        const selected = estadoFiltro === estado;
        return (
          <button
            key={estado}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(estado)}
            className={cn(
              "flex flex-1 items-center justify-center whitespace-nowrap rounded-xl border px-2.5 py-2 [@media(max-height:50rem)]:py-1 text-sm font-semibold transition",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
              selected
                ? "border-polaria-teal bg-polaria-teal text-polaria-on-teal"
                : "border-polaria-t-20 bg-polaria-t-08 text-polaria-w hover:border-polaria-teal hover:bg-polaria-t-20",
            )}
          >
            {ESTADO_ORDEN_VENTA_LABELS[estado]}
            <span
              className={cn(
                "ml-1.5 tabular-nums",
                selected ? "text-polaria-on-teal/80" : "text-polaria-w-50",
              )}
            >
              {countsByEstado[estado]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
