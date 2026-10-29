"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/** Nombre del botón (REQ-188: antes «Reorganizar con IA»). */
export const ETIQUETA_BOTON_REAGRUPAR = "Modificar con IA";

/**
 * Botón de la sección «Órdenes de trabajo» del Cypher. No se dibuja si no hay
 * `onClick`: el formulario de edición solo lo entrega cuando la OV está por confirmar.
 */
export function CypherReagruparOtButton({ onClick }: { onClick?: () => void }) {
  if (!onClick) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      title="Pide a la IA que cree, modifique o elimine órdenes de trabajo"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border border-polaria-t-20 bg-transparent px-2.5 py-1.5",
        "polaria-text-caption font-semibold text-polaria-teal transition hover:bg-polaria-t-08",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
      )}
    >
      <Sparkles className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
      {ETIQUETA_BOTON_REAGRUPAR}
    </button>
  );
}
