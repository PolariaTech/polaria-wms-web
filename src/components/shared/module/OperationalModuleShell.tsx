"use client";

import type { ReactNode } from "react";
import { BodegaRequiredGuard } from "@/components/auth/guards/BodegaRequiredGuard";
import { TenantScopeGuard } from "@/components/auth/guards/TenantScopeGuard";
import { cn } from "@/lib/utils/cn";
import { CYPHER_DOCK_RESERVE_CLASS } from "@/modules/sales/ordenes/constants/cypher-layout";
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
}

export function OperationalModuleShell({
  title,
  description,
  gate,
  headerExtra,
  children,
  accessDeniedMessage = ACCESS_DENIED_MESSAGE,
  dockForCypher = false,
}: OperationalModuleShellProps) {
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
            className={cn(
              "flex min-w-0 w-full flex-1 flex-col gap-6 py-8",
              "transition-[padding,max-width,margin] duration-[320ms] ease-out",
              dockForCypher
                ? // pl solo a la izquierda; pr = ancho Cypher (no usar px-* o pisa el dock).
                  cn("max-w-none pl-4 sm:pl-6", CYPHER_DOCK_RESERVE_CLASS)
                : "relative mx-auto max-w-6xl px-4 sm:px-6",
            )}
          >
            <header className="flex min-w-0 flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="polaria-text-display">{title}</h1>
                {description ? (
                  <p className="polaria-text-subtitle mt-2 text-polaria-w-50">
                    {description}
                  </p>
                ) : null}
              </div>
              {headerExtra}
            </header>
            <div className="min-w-0 w-full flex-1">{children}</div>
          </div>
        </ModuleRoleGate>
      </BodegaRequiredGuard>
    </TenantScopeGuard>
  );
}
