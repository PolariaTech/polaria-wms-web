"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface BotonDetalleOrdenProps {
  /** `true` con el panel derecho (Cypher) abierto en esta orden. */
  abierto: boolean;
  /** Código de la orden, para que el nombre del botón diga de cuál es. */
  venta: string;
  onAlternar: () => void;
}

/**
 * Botón de la columna Acciones que abre y cierra el panel derecho (Cypher) de una orden. Sigue la
 * misma convención que el botón del menú de Ventas: «+» abre y «−» cierra, así que el icono dice
 * el estado.
 */
export function BotonDetalleOrden({ abierto, venta, onAlternar }: BotonDetalleOrdenProps) {
  const Icono = abierto ? Minus : Plus;
  return (
    <button
      type="button"
      title={abierto ? "Cerrar detalle" : "Ver detalle"}
      aria-label={abierto ? `Cerrar detalle de ${venta}` : `Ver detalle de ${venta}`}
      aria-pressed={abierto}
      onClick={onAlternar}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-lg border transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
        abierto
          ? "border-polaria-teal bg-polaria-teal text-polaria-on-teal"
          : "border-polaria-t-20 bg-transparent text-polaria-teal hover:bg-polaria-t-08",
      )}
    >
      <Icono className="h-4 w-4" strokeWidth={2.25} aria-hidden />
    </button>
  );
}
