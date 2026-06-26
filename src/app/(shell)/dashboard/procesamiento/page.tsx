"use client";

import { WMS_MODULE } from "@/constants/permissions";
import {
  ROLES_NIVEL_CUENTA,
  WmsRol,
} from "@/constants/roles";
import { OperationalModuleShell } from "@/components/shared/OperationalModuleShell";
import { ProcesamientoPageContent } from "@/modules/processing";

const PROCESAMIENTO_ROLES = [
  WmsRol.procesador,
  ...ROLES_NIVEL_CUENTA,
  WmsRol.administrador_bodega,
  WmsRol.jefe_bodega,
] as const;

export default function DashboardProcesamientoPage() {
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
