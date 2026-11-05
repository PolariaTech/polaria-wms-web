"use client";

import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils/cn";

type Colocacion = "derecha" | "abajo";

interface PosicionAviso {
  left: number;
  top: number;
  colocacion: Colocacion;
}

/** Desde `lg` el menú es una columna con el contenido a su derecha; debajo de eso es una tira. */
function esColumna(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia("(min-width: 1024px)").matches;
}

/**
 * Dónde poner el aviso. En la columna va a la derecha del menú entero (no de la fila), centrado con
 * el botón; en la tira va justo debajo. Se calcula con coordenadas de la ventana porque el menú
 * recorta lo que se sale de él y el aviso se dibuja fuera, en el `body`.
 */
function calcularPosicion(item: HTMLElement): PosicionAviso {
  const fila = item.getBoundingClientRect();
  const menu = item.closest("aside")?.getBoundingClientRect();
  if (esColumna() && menu) {
    return { left: menu.right + 8, top: fila.top + fila.height / 2, colocacion: "derecha" };
  }
  return { left: fila.left, top: fila.bottom + 6, colocacion: "abajo" };
}

/**
 * Opción del menú de Ventas que todavía no existe: se ve apagada y sin enlace, pero reacciona al
 * mouse como las demás (fondo al pasar por encima) y muestra un aviso «Próximamente» fuera del menú,
 * alineado con el botón. También aparece al llegar con el teclado. El texto del aviso va siempre
 * en la fila, oculto a la vista, para los lectores de pantalla.
 */
export function VentasItemProximamente({
  icono: Icono,
  etiqueta,
  className,
}: {
  icono: LucideIcon;
  etiqueta: string;
  className?: string;
}) {
  const fila = useRef<HTMLSpanElement>(null);
  const [aviso, setAviso] = useState<PosicionAviso | null>(null);

  const mostrar = () => {
    if (fila.current) setAviso(calcularPosicion(fila.current));
  };
  const ocultar = () => setAviso(null);

  // Si la página se desplaza o cambia de tamaño con el aviso abierto, quedaría flotando fuera de sitio.
  useEffect(() => {
    if (!aviso) return;
    window.addEventListener("scroll", ocultar, true);
    window.addEventListener("resize", ocultar);
    return () => {
      window.removeEventListener("scroll", ocultar, true);
      window.removeEventListener("resize", ocultar);
    };
  }, [aviso]);

  return (
    <>
      <span
        ref={fila}
        aria-disabled="true"
        tabIndex={0}
        onMouseEnter={mostrar}
        onMouseLeave={ocultar}
        onFocus={mostrar}
        onBlur={ocultar}
        className={cn(
          "polaria-text-body-sm flex shrink-0 cursor-not-allowed items-center gap-2.5 whitespace-nowrap rounded-xl border border-transparent px-3 py-2 font-medium text-polaria-w-50 transition-colors motion-reduce:transition-none",
          "hover:bg-polaria-w-08 hover:text-polaria-w",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
          className,
        )}
      >
        <Icono className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
        {etiqueta}
        <span className="sr-only">Próximamente</span>
      </span>
      {aviso
        ? createPortal(
            <span
              role="tooltip"
              style={{ left: aviso.left, top: aviso.top }}
              className={cn(
                "pointer-events-none fixed z-50 whitespace-nowrap rounded-lg border border-polaria-w-20 bg-polaria-bg px-2.5 py-1.5 text-xs font-semibold text-polaria-w shadow-lg",
                aviso.colocacion === "derecha" ? "-translate-y-1/2" : "",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "absolute h-2 w-2 rotate-45 border-polaria-w-20 bg-polaria-bg",
                  aviso.colocacion === "derecha"
                    ? "-left-1 top-1/2 -translate-y-1/2 border-b border-l"
                    : "-top-1 left-4 border-l border-t",
                )}
              />
              Próximamente
            </span>,
            document.body,
          )
        : null}
    </>
  );
}
