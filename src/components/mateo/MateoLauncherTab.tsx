"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface MateoLauncherTabProps {
  /** El botón flotante de Mateo está escondido. */
  oculto: boolean;
  onAlternar: () => void;
}

/**
 * Pestaña pegada al borde derecho, a media altura: esconde el botón flotante de Mateo Soporte
 * (que tapaba las tablas) y lo vuelve a mostrar. La flecha dice a dónde irá: «›» lo manda al
 * borde y «‹» lo trae de vuelta. Está en el borde y no junto al botón porque el botón vive dentro
 * del widget y su posición no se conoce desde aquí.
 */
export function MateoLauncherTab({ oculto, onAlternar }: MateoLauncherTabProps) {
  const etiqueta = oculto ? "Mostrar Mateo Soporte" : "Ocultar Mateo Soporte";
  const Flecha = oculto ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onAlternar}
      aria-pressed={!oculto}
      aria-label={etiqueta}
      title={etiqueta}
      data-testid="mateo-launcher-tab"
      className={cn(
        "fixed right-0 top-1/2 z-[101] flex h-16 w-6 -translate-y-1/2 items-center justify-center",
        "rounded-l-xl border border-r-0 border-polaria-t-20 bg-polaria-bg text-polaria-teal",
        "shadow-[-4px_0_12px_-6px_rgb(0_0_0/0.5)] transition-colors motion-reduce:transition-none",
        "hover:bg-polaria-t-08",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal",
        // El área tocable se extiende hacia la izquierda sin ensanchar la pestaña.
        "before:absolute before:inset-y-0 before:-left-4 before:right-0 before:content-['']",
      )}
    >
      <Flecha className="h-4 w-4" strokeWidth={2} aria-hidden />
    </button>
  );
}
