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

interface CampoFechaProps {
  etiqueta: string;
  valor: string;
  /** Límites entre sí: el «desde» no puede pasar del «hasta». */
  minimo?: string;
  maximo?: string;
  onChange: (valor: string) => void;
}

function CampoFecha({
  etiqueta,
  valor,
  minimo,
  maximo,
  onChange,
}: CampoFechaProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="polaria-text-caption text-polaria-w-50">
        {etiqueta}
      </label>
      <input
        id={id}
        type="date"
        value={valor}
        min={minimo || undefined}
        max={maximo || undefined}
        onChange={(evento) => onChange(evento.target.value)}
        className={CAMPO_FECHA}
      />
    </div>
  );
}

function BotonLimpiar({ onLimpiar }: { onLimpiar: () => void }) {
  return (
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
  );
}

/** Filtros de la lista de correos: remitente, asunto y rango de fechas de recepción. */
export function CorreosFiltros({
  filtros,
  onChange,
  onLimpiar,
  hayFiltros,
}: CorreosFiltrosProps) {
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
        <CampoFecha
          etiqueta="Recibido desde"
          valor={filtros.desde}
          maximo={filtros.hasta}
          onChange={(valor) => onChange("desde", valor)}
        />
        <CampoFecha
          etiqueta="Hasta"
          valor={filtros.hasta}
          minimo={filtros.desde}
          onChange={(valor) => onChange("hasta", valor)}
        />
      </div>
      {hayFiltros ? <BotonLimpiar onLimpiar={onLimpiar} /> : null}
    </div>
  );
}
