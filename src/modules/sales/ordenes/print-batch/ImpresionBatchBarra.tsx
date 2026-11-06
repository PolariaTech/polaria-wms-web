"use client";

import { CheckCheck, Eraser, Eye, ListX, Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ImpresionBatchBarraProps {
  /** OV y OT elegidas (de toda la lista, no solo de lo filtrado). */
  elegidasOv: number;
  elegidasOt: number;
  /** OV que muestran los filtros ahora. */
  visibles: number;
  /** Hay OV visibles sin marcar por completo. */
  puedeMarcarVisibles: boolean;
  /** Alguna de las OV visibles tiene algo marcado. */
  hayElegidasVisibles: boolean;
  cargando: boolean;
  /** «Leyendo OV 2 de 5», mientras se arma la vista previa. */
  progreso: string | null;
  onMarcarVisibles: () => void;
  onQuitarVisibles: () => void;
  onLimpiar: () => void;
  onAceptar: () => void;
}

const FOCO =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg";

/** Pieza de un grupo segmentado; en pantalla angosta cada una se redondea sola y el grupo se parte en filas. */
const SEGMENTO = cn(
  "inline-flex min-h-11 [@media(max-height:50rem)]:min-h-9 items-center gap-2 border border-polaria-w-20 bg-polaria-w-08 px-3.5 text-sm font-semibold text-polaria-w transition motion-reduce:transition-none",
  "max-sm:rounded-xl sm:-ml-px sm:first:ml-0 sm:first:rounded-l-xl sm:last:rounded-r-xl",
  "hover:z-[1] hover:bg-polaria-t-08 hover:text-polaria-teal",
  "disabled:cursor-not-allowed disabled:text-polaria-w-50 disabled:hover:bg-polaria-w-08 disabled:hover:text-polaria-w-50",
  FOCO,
);

function Segmento({
  icono: Icono,
  texto,
  disabled,
  peligro = false,
  onClick,
}: {
  icono: LucideIcon;
  texto: string;
  disabled: boolean;
  peligro?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        SEGMENTO,
        peligro && "hover:bg-polaria-danger-bg hover:text-polaria-danger",
      )}
    >
      <Icono className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      {texto}
    </button>
  );
}

export function ImpresionBatchBarra({
  elegidasOv,
  elegidasOt,
  visibles,
  puedeMarcarVisibles,
  hayElegidasVisibles,
  cargando,
  progreso,
  onMarcarVisibles,
  onQuitarVisibles,
  onLimpiar,
  onAceptar,
}: ImpresionBatchBarraProps) {
  const hayElegidas = elegidasOt > 0;
  return (
    <div
      className={cn(
        "flex shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-3",
        // En pantalla angosta la lista no tiene alto propio: la barra se queda pegada abajo
        // para que «Aceptar» siempre esté a la mano.
        "max-lg:sticky max-lg:bottom-0 max-lg:z-10 max-lg:-mx-4 max-lg:border-t max-lg:border-polaria-w-08 max-lg:bg-polaria-bg max-lg:px-4 max-lg:py-3 sm:max-lg:-mx-6 sm:max-lg:px-6",
      )}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-x-5 gap-y-2">
        <p
          role="status"
          className="polaria-text-body tabular-nums text-polaria-w"
        >
          {hayElegidas ? (
            <>
              <strong className="font-semibold">{elegidasOt}</strong> OT de{" "}
              <strong className="font-semibold">{elegidasOv}</strong> OV
            </>
          ) : (
            "Nada seleccionado"
          )}
        </p>
        <div role="group" aria-label="Acciones sobre la selección" className="flex flex-wrap gap-2 sm:gap-0">
          <Segmento
            icono={CheckCheck}
            texto={visibles > 0 ? `Marcar las ${visibles} visibles` : "Marcar visibles"}
            disabled={!puedeMarcarVisibles || cargando}
            onClick={onMarcarVisibles}
          />
          <Segmento
            icono={ListX}
            texto="Quitar las visibles"
            disabled={!hayElegidasVisibles || cargando}
            onClick={onQuitarVisibles}
          />
          <Segmento
            icono={Eraser}
            texto="Limpiar todo"
            peligro
            disabled={!hayElegidas || cargando}
            onClick={onLimpiar}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          if (!cargando) onAceptar();
        }}
        disabled={!hayElegidas}
        aria-disabled={cargando || undefined}
        aria-busy={cargando || undefined}
        className={cn(
          "inline-flex min-h-11 [@media(max-height:50rem)]:min-h-9 items-center gap-2 rounded-xl border px-5 py-2.5 [@media(max-height:50rem)]:py-1.5 text-sm font-semibold transition motion-reduce:transition-none",
          "border-polaria-teal bg-polaria-teal text-polaria-on-teal hover:opacity-90",
          // Sin elección se apaga; cargando conserva el color para que se lea el progreso.
          "disabled:cursor-not-allowed disabled:border-polaria-w-08 disabled:bg-polaria-w-08 disabled:text-polaria-w-50 disabled:opacity-100",
          cargando && "cursor-progress hover:opacity-100",
          FOCO,
        )}
      >
        {cargando ? (
          <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" strokeWidth={1.75} aria-hidden />
        ) : (
          <Eye className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        )}
        {cargando ? (progreso ?? "Preparando…") : "Ver vista previa"}
      </button>
    </div>
  );
}
