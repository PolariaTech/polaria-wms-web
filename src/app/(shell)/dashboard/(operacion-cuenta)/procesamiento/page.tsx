"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { WMS_MODULE } from "@/constants/wms/permissions";
import {
  ROLES_NIVEL_CUENTA,
  WmsRol,
} from "@/constants/wms/roles";
import { ROUTES } from "@/config/routes";
import { OperationalModuleShell } from "@/components/shared/module/OperationalModuleShell";
import { ProcesamientoPageContent } from "@/modules/processing";
import { useAuthStore } from "@/stores/auth.store";

const PROCESAMIENTO_ROLES = [
  WmsRol.procesador,
  ...ROLES_NIVEL_CUENTA,
  WmsRol.administrador_bodega,
  WmsRol.jefe_bodega,
] as const;

export default function DashboardProcesamientoPage() {
  const router = useRouter();
  const idRol = useAuthStore((state) => state.session?.idRol);

  useEffect(() => {
    if (idRol === WmsRol.operador_cuenta) {
      router.replace(ROUTES.dashboardBodegaInternaCuentaProcesamiento);
    }
  }, [idRol, router]);

  if (idRol === WmsRol.operador_cuenta) {
    return null;
  }

  return (
    <OperationalModuleShell
      title="Procesamiento"
      description="Solicitudes de transformación y tareas operativas en cola."
      gate={{
        module: WMS_MODULE.PROCESSING,
        roles: PROCESAMIENTO_ROLES,
      }}
    >
      <ProcesamientoPageContent />
    </OperationalModuleShell>
  );
}
