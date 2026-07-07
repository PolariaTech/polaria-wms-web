"use client";

import type { ReactNode } from "react";
import { hasPermission, type Permission } from "@/constants/wms/permissions";
import { hasMinNivelRol, type WmsRol } from "@/constants/wms/roles";
import { useAuthStore } from "@/stores/auth.store";
import type { NivelRol } from "@/types/auth/auth";

export interface RoleGateProps {
  children: ReactNode;
  permission?: Permission;
  idRol?: WmsRol | readonly WmsRol[];
  minNivelRol?: NivelRol;
  fallback?: ReactNode;
}

/** Renderiza `children` si la sesión cumple al menos un criterio indicado. */
export function RoleGate({
  children,
  permission,
  idRol,
  minNivelRol,
  fallback = null,
}: RoleGateProps) {
  const session = useAuthStore((s) => s.session);

  if (!session) {
    return <>{fallback}</>;
  }

  const checks: boolean[] = [];

  if (permission !== undefined) {
    checks.push(hasPermission(session.idRol, permission));
  }

  if (idRol !== undefined) {
    const roles = Array.isArray(idRol) ? idRol : [idRol];
    checks.push(roles.includes(session.idRol as WmsRol));
  }

  if (minNivelRol !== undefined) {
    checks.push(hasMinNivelRol(session.nivelRol, minNivelRol));
  }

  const allowed = checks.length === 0 ? true : checks.some(Boolean);

  return allowed ? <>{children}</> : <>{fallback}</>;
}
