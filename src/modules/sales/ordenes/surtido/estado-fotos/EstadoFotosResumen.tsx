"use client";

import { cn } from "@/lib/utils/cn";
import type { EstadoFoto, ResumenFotos } from "./estado-fotos.logic";

interface EstadoFotosResumenProps {
  resumen: ResumenFotos;
  /** Estado por el que está filtrada la tabla; null = todos. */
  seleccionado: EstadoFoto | null;
  onSeleccionar: (estado: EstadoFoto | null) => void;
}

const BLOQUES: ReadonlyArray<{
  estado: EstadoFoto;
  etiqueta: string;
  /** Color del número: el estado se lee por el texto, el color solo lo refuerza. */
  numero: string;
}> = [
  { estado: "lista", etiqueta: "Listas", numero: "text-polaria-teal" },
  { estado: "fallo", etiqueta: "Con fallo", numero: "text-polaria-danger" },
  { estado: "procesando", etiqueta: "Procesando", numero: "text-polaria-w" },
  { estado: "recibida", etiqueta: "Recibidas", numero: "text-polaria-w" },
];

const CLASES_BLOQUE =
  "flex min-w-0 flex-col items-start gap-1 rounded-2xl border px-4 py-3 text-left transition-colors [@media(max-height:50rem)]:py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg";

function clasesSegunActivo(activo: boolean): string {
  return activo
    ? "border-polaria-teal bg-polaria-t-08"
    : "border-polaria-w-08 hover:border-polaria-w-20 hover:bg-polaria-w-08";
}

/**
 * Cuántas fotos hay en cada estado. Cada bloque es también el filtro de la tabla: al pulsarlo
 * la tabla muestra solo ese estado. «Todas» va primero y quita el filtro; pulsar otra vez el estado
 * activo también lo quita.
 */
export function EstadoFotosResumen({
  resumen,
  seleccionado,
  onSeleccionar,
}: EstadoFotosResumenProps) {
  const todas = seleccionado === null;
  return (
    <div
      role="group"
      aria-label="Fotos por estado"
      className="grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-5"
    >
      <button
        type="button"
        aria-pressed={todas}
        onClick={() => onSeleccionar(null)}
        className={cn(CLASES_BLOQUE, "col-span-2 lg:col-span-1", clasesSegunActivo(todas))}
      >
        <span className="text-2xl font-semibold tabular-nums leading-none text-polaria-w">
          {resumen.total}
        </span>
        <span className="polaria-text-body-sm text-polaria-w-50">Todas</span>
      </button>
      {BLOQUES.map((bloque) => {
        const activo = seleccionado === bloque.estado;
        return (
          <button
            key={bloque.estado}
            type="button"
            aria-pressed={activo}
            onClick={() => onSeleccionar(activo ? null : bloque.estado)}
            className={cn(CLASES_BLOQUE, clasesSegunActivo(activo))}
          >
            <span
              className={cn(
                "text-2xl font-semibold tabular-nums leading-none",
                // Un cero no es noticia: se atenúa para que lo que sí hay (sobre todo un fallo) gane la vista.
                resumen[bloque.estado] === 0 ? "text-polaria-w-50" : bloque.numero,
              )}
            >
              {resumen[bloque.estado]}
            </span>
            <span className="polaria-text-body-sm text-polaria-w-50">
              {bloque.etiqueta}
            </span>
          </button>
        );
      })}
      {resumen.colgadas > 0 ? (
        <p
          role="status"
          className="polaria-text-body-sm col-span-2 rounded-xl border border-polaria-warning-border bg-polaria-warning-bg px-3 py-2 text-polaria-warning lg:col-span-5"
        >
          {resumen.colgadas === 1
            ? "1 foto lleva más de 2 minutos sin terminar. Pide que la tomen de nuevo."
            : `${resumen.colgadas} fotos llevan más de 2 minutos sin terminar. Pide que las tomen de nuevo.`}
        </p>
      ) : null}
    </div>
  );
}
