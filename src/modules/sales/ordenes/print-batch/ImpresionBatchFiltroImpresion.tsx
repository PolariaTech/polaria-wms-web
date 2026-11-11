"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { ImpresionOvBatch } from "./batch-seleccion";

/** Cuántas órdenes de venta hay en cada grupo; `null` mientras no se sabe qué se imprimió antes. */
export interface ConteosImpresion {
  todas: number;
  sinImprimir: number | null;
  impresas: number | null;
}

interface ImpresionBatchFiltroImpresionProps {
  valor: ImpresionOvBatch;
  conteos: ConteosImpresion;
  /** Se está leyendo el registro de impresiones de las órdenes. */
  buscando: boolean;
  /** Cuántas órdenes no se pudieron revisar: pueden estar impresas aunque no salgan marcadas. */
  sinRevisar?: number;
  onChange: (valor: ImpresionOvBatch) => void;
}

const OPCIONES: ReadonlyArray<{ valor: ImpresionOvBatch; etiqueta: string; conteo: keyof ConteosImpresion }> = [
  { valor: "todas", etiqueta: "Todas", conteo: "todas" },
  { valor: "sin_imprimir", etiqueta: "Sin imprimir", conteo: "sinImprimir" },
  { valor: "impresas", etiqueta: "Ya impresas", conteo: "impresas" },
];

const MENSAJE_SIN_REVISAR = (n: number) =>
  `No se pudo revisar ${n} ${n === 1 ? "orden" : "órdenes"}: podrían estar impresas aunque no salgan marcadas.`;

/**
 * «Todas / Sin imprimir / Ya impresas» (REQ-298): para sacar solo lo nuevo o para volver a imprimir
 * una orden que ya salió. Cada opción dice cuántas órdenes tiene en cuanto se sabe.
 */
export function ImpresionBatchFiltroImpresion({ valor, conteos, buscando, sinRevisar = 0, onChange }: ImpresionBatchFiltroImpresionProps) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-1">
      <legend className="mb-1 whitespace-nowrap text-xs font-medium text-polaria-w">
        Estado de impresión
        {/* Aviso corto en la línea del título: no ocupa sitio entre los botones ni mueve nada. El texto completo va aparte, solo para lectores de pantalla. */}
        {!buscando && sinRevisar > 0 ? (
          <span aria-hidden title={MENSAJE_SIN_REVISAR(sinRevisar)} className="ml-2 font-normal text-polaria-warning">
            · {sinRevisar} sin revisar
          </span>
        ) : null}
      </legend>
      <div className="flex flex-wrap items-center gap-1.5">
        {OPCIONES.map((opcion) => {
          const activo = valor === opcion.valor;
          const cantidad = conteos[opcion.conteo];
          return (
            <button
              key={opcion.valor}
              type="button"
              aria-pressed={activo}
              onClick={() => onChange(opcion.valor)}
              className={cn(
                "h-11 [@media(max-height:50rem)]:h-9 whitespace-nowrap rounded-xl border px-3 text-sm font-semibold tabular-nums transition motion-reduce:transition-none",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
                activo
                  ? "border-polaria-teal bg-polaria-t-20 text-polaria-w"
                  : "border-polaria-w-20 text-polaria-w hover:border-polaria-t-20 hover:bg-polaria-w-08",
              )}
            >
              {opcion.etiqueta}
              {cantidad !== null ? (
                ` (${cantidad})`
              ) : buscando ? (
                // Un spinner donde irá el contador: ocupa lo mismo que el número y no mueve los botones.
                <Loader2
                  aria-hidden
                  className="ml-1.5 inline-block h-3.5 w-3.5 animate-spin align-[-2px] motion-reduce:animate-none"
                  strokeWidth={2}
                />
              ) : null}
            </button>
          );
        })}
      </div>
      {/* Existe siempre y se llena después: así los lectores de pantalla sí anuncian el cambio. */}
      <span aria-live="polite" className="sr-only">
        {buscando ? "Revisando qué se imprimió antes…" : sinRevisar > 0 ? MENSAJE_SIN_REVISAR(sinRevisar) : null}
      </span>
    </fieldset>
  );
}
