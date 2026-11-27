"use client";

import { RotateCw } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ImpresionBatchRefrescarProps {
  /** Vuelve a leer las órdenes y el registro de impresiones, sin tocar filtros ni selección. */
  onRefrescar: () => void;
  /** Mientras se carga o se arma una vista previa no se puede refrescar. */
  disabled: boolean;
  /** Hay una recarga en curso: el ícono gira. */
  refrescando: boolean;
}

/** Botón de actualizar de la lista de impresión (REQ-434), igual al de la tabla de ventas. */
export function ImpresionBatchRefrescar({ onRefrescar, disabled, refrescando }: ImpresionBatchRefrescarProps) {
  return (
    <button
      type="button"
      onClick={onRefrescar}
      disabled={disabled}
      aria-label="Actualizar lista"
      className={cn(
        // Mismo alto y esquinas que los botones de «Estado de impresión» (h-11; h-9 en pantallas bajas).
        "flex h-11 w-11 [@media(max-height:50rem)]:h-9 [@media(max-height:50rem)]:w-9 shrink-0 items-center justify-center rounded-xl border border-polaria-t-20 text-polaria-teal transition motion-reduce:transition-none",
        "hover:bg-polaria-t-08 disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
      )}
    >
      <RotateCw className={cn("h-4 w-4", refrescando && "animate-spin")} strokeWidth={1.75} aria-hidden />
    </button>
  );
}
