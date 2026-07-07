"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/config/routes";
import { WmsRol } from "@/constants/wms/roles";
import { usePermissions } from "@/hooks/auth/usePermissions";

type BodegaLegacyView = "estado" | "reportes";

const LEGACY_DESTINATION: Record<
  BodegaLegacyView,
  Record<string, string>
> = {
  estado: {
    [WmsRol.administrador_bodega]: ROUTES.dashboardAdministradorBodegaEstado,
    [WmsRol.jefe_bodega]: ROUTES.dashboardJefeBodegaEstado,
  },
  reportes: {
    [WmsRol.administrador_bodega]: ROUTES.dashboardAdministradorBodegaReportes,
    [WmsRol.jefe_bodega]: ROUTES.dashboardJefeBodegaEstado,
  },
};

interface BodegaOperacionLegacyRedirectProps {
  view: BodegaLegacyView;
}

export function BodegaOperacionLegacyRedirect({
  view,
}: BodegaOperacionLegacyRedirectProps) {
  const router = useRouter();
  const { idRol } = usePermissions();

  useEffect(() => {
    const destination =
      (idRol && LEGACY_DESTINATION[view][idRol]) ?? ROUTES.dashboard;
    router.replace(destination);
  }, [idRol, router, view]);

  return null;
}
