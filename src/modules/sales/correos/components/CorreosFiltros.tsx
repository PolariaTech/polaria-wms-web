"use client";

import { X } from "lucide-react";
import { useId } from "react";
import { PolariaTableSearchField } from "@/components/shared/table/PolariaTableSearchField";
import { cn } from "@/lib/utils/cn";
import type { FiltrosCorreos } from "../types/correos.types";

interface CorreosFiltrosProps {
  filtros: FiltrosCorreos;
  onChange: (campo: keyof FiltrosCorreos, valor: string) => void;
  onLimpiar: () => void;
  hayFiltros: boolean;
}

const CAMPO_FECHA = cn(
  "h-9 rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-3 [color-scheme:dark]",
  "polaria-text-body-sm tabular-nums text-polaria-w outline-none",
  "focus:border-polaria-t-20 focus:ring-1 focus:ring-polaria-t-20",
);

/** Filtros de la lista de correos: remitente, asunto y rango de fechas de recepción. */
export function CorreosFiltros({
  filtros,
  onChange,
  onLimpiar,
  hayFiltros,
}: CorreosFiltrosProps) {
  const idDesde = useId();
  const idHasta = useId();

  return (
    <div
      role="search"
      aria-label="Filtrar correos"
      className="flex flex-wrap items-end gap-3 border-b border-polaria-w-08 px-5 py-3 sm:px-6"
    >
      <PolariaTableSearchField
        value={filtros.remitente}
        onChange={(valor) => onChange("remitente", valor)}
        placeholder="Buscar remitente…"
      />
      <PolariaTableSearchField
        value={filtros.asunto}
        onChange={(valor) => onChange("asunto", valor)}
        placeholder="Buscar asunto…"
      />

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor={idDesde} className="polaria-text-caption text-polaria-w-50">
            Recibido desde
          </label>
          <input
            id={idDesde}
            type="date"
            value={filtros.desde}
            max={filtros.hasta || undefined}
            onChange={(evento) => onChange("desde", evento.target.value)}
            className={CAMPO_FECHA}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={idHasta} className="polaria-text-caption text-polaria-w-50">
            Hasta
          </label>
          <input
            id={idHasta}
            type="date"
            value={filtros.hasta}
            min={filtros.desde || undefined}
            onChange={(evento) => onChange("hasta", evento.target.value)}
            className={CAMPO_FECHA}
          />
        </div>
      </div>

      {hayFiltros ? (
        <button
          type="button"
          onClick={onLimpiar}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-xl border border-polaria-t-20 px-3",
            "polaria-text-body-sm font-semibold text-polaria-teal transition hover:bg-polaria-t-08",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
          )}
        >
          <X className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          Limpiar filtros
        </button>
      ) : null}
    </div>
  );
}
