"use client";

import { useId } from "react";
import { cn } from "@/lib/utils/cn";

const ANGULOS_LOBULOS = [0, 60, 120, 180, 240, 300];
const ANGULOS_PUNTOS = [30, 90, 150, 210, 270, 330];

/**
 * Isotipo de Polo (marca Polaria, `polaria-isotipo-polo.svg`) sin la baldosa: el cuerpo toma
 * `currentColor` y los ojos son un recorte, así se ve igual en tema oscuro y claro.
 */
function IconoPolo({ className }: { className?: string }) {
  const idMascara = useId();
  return (
    <svg viewBox="6 6 88 88" className={className} aria-hidden focusable="false">
      <defs>
        <mask id={idMascara}>
          <rect x="0" y="0" width="100" height="100" fill="#fff" />
          <path d="M35.3 48.2h10.4a5.5 5.5 0 1 1-10.4 0" fill="#000" />
          <path d="M54.3 48.2h10.4a5.5 5.5 0 1 1-10.4 0" fill="#000" />
        </mask>
      </defs>
      <g mask={`url(#${idMascara})`} fill="currentColor" stroke="currentColor">
        <circle cx="50" cy="50" r="25" stroke="none" />
        <g strokeWidth="15" strokeLinecap="round">
          {ANGULOS_LOBULOS.map((a) => (
            <line key={a} x1="50" x2="50" y1="50" y2="14" transform={`rotate(${a} 50 50)`} />
          ))}
        </g>
        <g stroke="none">
          {ANGULOS_PUNTOS.map((a) => (
            <circle key={a} cx="50" cy="16" r="4" transform={`rotate(${a} 50 50)`} />
          ))}
        </g>
      </g>
    </svg>
  );
}

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
      <IconoPolo className="h-4 w-4 shrink-0" />
      {ETIQUETA_BOTON_REAGRUPAR}
    </button>
  );
}
