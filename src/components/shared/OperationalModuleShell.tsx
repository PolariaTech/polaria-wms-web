"use client";

import type { ReactNode } from "react";
import { BodegaRequiredGuard } from "@/components/auth/BodegaRequiredGuard";
import { TenantScopeGuard } from "@/components/auth/TenantScopeGuard";
import {
  ModuleRoleGate,
  type ModuleRoleGateProps,
} from "./ModuleRoleGate";

const ACCESS_DENIED_MESSAGE =
  "No tienes permiso para acceder a este módulo operativo.";

export interface OperationalModuleShellProps {
  title: string;
  description: string;
  gate: Omit<ModuleRoleGateProps, "children" | "fallback">;
  headerExtra?: ReactNode;
  children: ReactNode;
  accessDeniedMessage?: string;
}

export function OperationalModuleShell({
  title,
  description,
  gate,
  headerExtra,
  children,
  accessDeniedMessage = ACCESS_DENIED_MESSAGE,
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
          <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
            <header className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="polaria-text-display">{title}</h1>
                <p className="polaria-text-subtitle mt-2 text-polaria-w-50">
                  {description}
                </p>
              </div>
              {headerExtra}
            </header>
            {children}
          </div>
        </ModuleRoleGate>
      </BodegaRequiredGuard>
    </TenantScopeGuard>
  );
}
