"use client";

import type { ReactNode } from "react";
import {
  canAccessModule,
  hasPermission,
  type Permission,
  type WmsModule,
} from "@/constants/wms/permissions";
import { hasMinNivelRol, type WmsRol } from "@/constants/wms/roles";
import { useAuthStore } from "@/stores/auth.store";
import type { NivelRol } from "@/types/auth/auth";

export interface ModuleRoleGateProps {
  children: ReactNode;
  fallback?: ReactNode;
  permission?: Permission;
  module?: WmsModule;
  minNivelRol?: NivelRol;
  roles?: readonly WmsRol[];
}

/** Gate AND: todas las condiciones indicadas deben cumplirse (alineado a navigation.ts). */
export function ModuleRoleGate({
  children,
  fallback = null,
  permission,
  module,
  minNivelRol,
  roles,
}: ModuleRoleGateProps) {
  const session = useAuthStore((s) => s.session);

  if (!session) {
    return <>{fallback}</>;
  }

  const requirements: boolean[] = [];

  if (permission !== undefined) {
    requirements.push(hasPermission(session.idRol, permission));
  }

  if (module !== undefined) {
    requirements.push(
      canAccessModule(session.idRol, session.nivelRol, module),
    );
  }

  if (minNivelRol !== undefined) {
    requirements.push(hasMinNivelRol(session.nivelRol, minNivelRol));
  }

  if (roles !== undefined) {
    requirements.push(roles.includes(session.idRol as WmsRol));
  }

  if (requirements.length === 0) {
    return <>{children}</>;
  }

  return requirements.every(Boolean) ? <>{children}</> : <>{fallback}</>;
}
