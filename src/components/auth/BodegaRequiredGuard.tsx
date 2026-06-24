"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ROUTES } from "@/config/routes";
import {
  TenantBodegaSelector,
  useCompany,
} from "@/providers/CompanyProvider";

interface BodegaRequiredGuardProps {
  children: React.ReactNode;
}

/**
 * Rutas que requieren bodega activa. Si el usuario tiene bodegas asignadas
 * pero ninguna seleccionada, redirige al dashboard (selector en topbar).
 */
export function BodegaRequiredGuard({ children }: BodegaRequiredGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { idBodegas, activeBodegaId } = useCompany();

  const requiresSelection =
    idBodegas.length > 0 && activeBodegaId === null;
  const onDashboard = pathname === ROUTES.dashboard;

  useEffect(() => {
    if (!requiresSelection || onDashboard) return;
    router.replace(ROUTES.dashboard);
  }, [onDashboard, requiresSelection, router]);

  if (requiresSelection) {
    if (onDashboard) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-10">
          <p className="polaria-text-subtitle text-center text-polaria-w-50">
            Selecciona una bodega activa para continuar.
          </p>
          <TenantBodegaSelector />
        </div>
      );
    }

    return null;
  }

  return <>{children}</>;
}
