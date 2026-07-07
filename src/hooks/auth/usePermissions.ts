"use client";

import {
  canAccessModule,
  hasPermission,
  type Permission,
  type WmsModule,
} from "@/constants/wms/permissions";
import type { WmsRol } from "@/constants/wms/roles";
import { useAuthStore } from "@/stores/auth.store";
import type { NivelRol } from "@/types/auth/auth";

export function usePermissions() {
  const session = useAuthStore((s) => s.session);

  const idRol = (session?.idRol ?? null) as WmsRol | string | null;
  const nivelRol = (session?.nivelRol ?? null) as NivelRol | null;

  return {
    idRol,
    nivelRol,
    hasPermission: (permission: Permission) =>
      idRol ? hasPermission(idRol, permission) : false,
    canAccessModule: (module: WmsModule) =>
      canAccessModule(idRol, nivelRol, module),
  };
}
