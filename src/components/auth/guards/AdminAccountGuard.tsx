"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { WmsRol } from "@/constants/wms/roles";
import { ROUTES } from "@/config/routes";
import { usePermissions } from "@/hooks/auth/usePermissions";
import { useAuthStore } from "@/stores/auth.store";

interface AdminAccountGuardProps {
  children: React.ReactNode;
}

/** Restringe el dominio administrativo a administrador de cuenta. */
export function AdminAccountGuard({ children }: AdminAccountGuardProps) {
  const router = useRouter();
  const { idRol } = usePermissions();
  const isHydrated = useAuthStore((s) => s.isHydrated);

  useEffect(() => {
    if (!isHydrated) return;
    if (idRol !== WmsRol.administrador_cuenta) {
      router.replace(ROUTES.dashboard);
    }
  }, [idRol, isHydrated, router]);

  if (!isHydrated || idRol !== WmsRol.administrador_cuenta) {
    return null;
  }

  return <>{children}</>;
}
