"use client";

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
  onChange: (valor: ImpresionOvBatch) => void;
}

const OPCIONES: ReadonlyArray<{ valor: ImpresionOvBatch; etiqueta: string; conteo: keyof ConteosImpresion }> = [
  { valor: "todas", etiqueta: "Todas las órdenes", conteo: "todas" },
  { valor: "sin_imprimir", etiqueta: "Sin imprimir", conteo: "sinImprimir" },
  { valor: "impresas", etiqueta: "Ya impresas", conteo: "impresas" },
];

/**
 * «Todas / Sin imprimir / Ya impresas» (REQ-298): para sacar solo lo nuevo o para volver a imprimir
 * una orden que ya salió. Cada opción dice cuántas órdenes tiene en cuanto se sabe.
 */
export function ImpresionBatchFiltroImpresion({ valor, conteos, buscando, onChange }: ImpresionBatchFiltroImpresionProps) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-1">
      <legend className="mb-1 text-xs font-medium text-polaria-w">Impresión</legend>
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
              {cantidad === null ? null : ` (${cantidad})`}
            </button>
          );
        })}
        {buscando ? (
          <p role="status" className="polaria-text-body-sm text-polaria-w">
            Revisando qué se imprimió antes…
          </p>
        ) : null}
      </div>
    </fieldset>
  );
}
