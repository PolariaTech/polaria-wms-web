"use client";

import type { ReactNode } from "react";
import { BodegaRequiredGuard } from "@/components/auth/guards/BodegaRequiredGuard";
import { TenantScopeGuard } from "@/components/auth/guards/TenantScopeGuard";
import { cn } from "@/lib/utils/cn";
import { BotonMenuVentas } from "@/modules/sales/correos/components/VentasSidebar";
import { cypherDockReserveClass } from "@/modules/sales/ordenes/constants/cypher-layout";
import { useShellOverlayStore } from "@/stores/shell-overlay.store";
import {
  ModuleRoleGate,
  type ModuleRoleGateProps,
} from "./ModuleRoleGate";

const ACCESS_DENIED_MESSAGE =
  "No tienes permiso para acceder a este módulo operativo.";

export interface OperationalModuleShellProps {
  title: string;
  description?: string;
  gate: Omit<ModuleRoleGateProps, "children" | "fallback">;
  headerExtra?: ReactNode;
  children: ReactNode;
  accessDeniedMessage?: string;
  /**
   * Cypher abierto: la lista usa todo el ancho a la izquierda
   * (padding-right = ancho Cypher), sin centrar en max-w-6xl.
   */
  dockForCypher?: boolean;
  /**
   * En pantalla ancha el módulo mide justo el alto de la ventana (menos la barra superior): el
   * título y los controles quedan a la vista y solo se desplaza lo que el contenido decida
   * (`flex-1 min-h-0` + `overflow-auto`). En pantalla angosta la página se desplaza normal.
   * Es opcional: sin ella el módulo crece con su contenido, como siempre.
   */
  fitViewport?: boolean;
  /**
   * En pantallas bajas (menos de 50 rem de alto, típico de un portátil) el título, los márgenes
   * y los espacios se reducen para que quepan la tabla y su paginación sin desplazar la página.
   * No cambia nada en pantallas altas ni en los módulos que no la usan.
   */
  compactoEnPantallaBaja?: boolean;
}

export function OperationalModuleShell({
  title,
  description,
  gate,
  headerExtra,
  children,
  accessDeniedMessage = ACCESS_DENIED_MESSAGE,
  dockForCypher = false,
  fitViewport = false,
  compactoEnPantallaBaja = false,
}: OperationalModuleShellProps) {
  const cypherWidthMode = useShellOverlayStore((s) => s.cypherWidthMode);
  return (
    <TenantScopeGuard>
      <BodegaRequiredGuard>
        <ModuleRoleGate
          {...gate}
          fallback={
            <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
              <p className="polaria-text-subtitle text-center text-polaria-w-50">
                {accessDeniedMessage}
              </p>
            </div>
          }
        >
          <div
            data-fit-viewport={fitViewport || undefined}
            className={cn(
              "flex min-w-0 w-full flex-1 flex-col gap-6 py-8",
              "transition-[padding,max-width,margin] duration-[320ms] ease-out motion-reduce:transition-none",
              fitViewport &&
                "lg:h-[calc(100dvh-var(--polaria-shell-top))] lg:flex-none",
              compactoEnPantallaBaja &&
                "[@media(max-height:50rem)]:gap-3 [@media(max-height:50rem)]:py-4",
              dockForCypher
                ? // pl solo a la izquierda; pr = ancho Cypher (no usar px-* o pisa el dock).
                  cn(
                    "max-w-none pl-4 sm:pl-6",
                    cypherDockReserveClass(cypherWidthMode),
                  )
                : "relative mx-auto max-w-6xl px-4 sm:px-6",
            )}
          >
            <header className="flex min-w-0 shrink-0 flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                {/* Solo en Ventas hay botón (el propio componente decide): en otros módulos el título queda igual. */}
                <div className="flex min-w-0 items-center gap-3">
                  <BotonMenuVentas />
                  <h1
                    className={cn(
                      "polaria-text-display min-w-0",
                      // Pantallas bajas (portátiles): el título no se come la altura de la tabla.
                      compactoEnPantallaBaja && "[@media(max-height:50rem)]:text-[1.75rem]!",
                    )}
                  >
                    {title}
                  </h1>
                </div>
                {description ? (
                  <p
                    className={cn(
                      "polaria-text-subtitle mt-2 text-polaria-w-50",
                      // Pantallas bajas: la altura es para la tabla; el título ya dice de qué se trata.
                      compactoEnPantallaBaja && "[@media(max-height:50rem)]:hidden",
                    )}
                  >
                    {description}
                  </p>
                ) : null}
              </div>
              {headerExtra}
            </header>
            <div
              className={cn(
                "min-w-0 w-full flex-1",
                fitViewport && "flex min-h-0 flex-col",
              )}
            >
              {children}
            </div>
          </div>
        </ModuleRoleGate>
      </BodegaRequiredGuard>
    </TenantScopeGuard>
  );
}
