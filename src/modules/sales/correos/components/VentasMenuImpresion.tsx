"use client";

import { ChevronDown, ListChecks, Printer, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/utils/cn";
import { VentasItemProximamente } from "./VentasItemProximamente";

const FOCO =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg";

const FILA =
  "flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl border px-3 transition-colors motion-reduce:transition-none polaria-text-body-sm font-medium";

/**
 * Entrada «Impresión en batch» del menú de Ventas: un desplegable con las dos formas de imprimir.
 * La detallada (elegir OV y OT una por una) ya existe; la rápida (imprimir por fecha con un par de
 * clics) se construye después, así que aparece apagada y avisa «Próximamente» en vez de llevar a una
 * pantalla que no existe (`VentasItemProximamente`). En la columna las opciones quedan sangradas debajo; en la tira horizontal
 * de pantallas angostas se acomodan en la misma fila.
 */
export function VentasMenuImpresion({ pathname }: { pathname: string }) {
  const rutaDetallada = ROUTES.dashboardVentasImpresionBatch;
  const enImpresion = pathname === rutaDetallada || pathname.startsWith(`${rutaDetallada}/`);
  const [abierto, setAbierto] = useState(enImpresion);
  const idLista = useId();

  // Si se llega a una pantalla de impresión por otro camino, el grupo se abre solo.
  useEffect(() => {
    if (enImpresion) setAbierto(true);
  }, [enImpresion]);

  return (
    <div className="contents lg:flex lg:flex-col lg:gap-1">
      <button
        type="button"
        aria-expanded={abierto}
        aria-controls={idLista}
        onClick={() => setAbierto((actual) => !actual)}
        className={cn(
          FILA,
          "py-2.5",
          FOCO,
          enImpresion && !abierto
            ? "border-polaria-t-20 bg-polaria-t-08 text-polaria-teal"
            : "border-transparent text-polaria-w-50 hover:bg-polaria-w-08 hover:text-polaria-w",
        )}
      >
        <Printer className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
        Impresión en batch
        <ChevronDown
          className={cn(
            "ml-auto h-4 w-4 shrink-0 transition-transform duration-200 ease-out motion-reduce:transition-none",
            abierto && "rotate-180",
          )}
          strokeWidth={1.75}
          aria-hidden
        />
      </button>

      <ul
        id={idLista}
        aria-label="Formas de imprimir"
        className={cn(abierto ? "contents lg:flex lg:flex-col lg:gap-1 lg:pl-4" : "hidden")}
      >
        <li className="contents lg:block">
          <Link
            href={rutaDetallada}
            aria-current={enImpresion ? "page" : undefined}
            className={cn(
              FILA,
              "py-2",
              FOCO,
              enImpresion
                ? "border-polaria-t-20 bg-polaria-t-08 text-polaria-teal"
                : "border-transparent text-polaria-w-50 hover:bg-polaria-w-08 hover:text-polaria-w",
            )}
          >
            <ListChecks className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
            Impresión detallada
          </Link>
        </li>
        <li className="contents lg:block">
          <VentasItemProximamente icono={Zap} etiqueta="Impresión rápida" />
        </li>
      </ul>
    </div>
  );
}
