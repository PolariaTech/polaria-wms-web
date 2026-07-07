"use client";

import { ROLES_NIVEL_CUENTA } from "@/constants/wms/roles";
import { OperationalModuleShell } from "@/components/shared/module/OperationalModuleShell";
import { OperadorProcesamientoPageContent } from "@/modules/processing";

export default function DashboardBodegaInternaCuentaProcesamientoPage() {
  return (
    <OperationalModuleShell
      title="Procesamiento"
      description="Órdenes de transformación insumo → resultado."
      gate={{ roles: ROLES_NIVEL_CUENTA }}
    >
      <OperadorProcesamientoPageContent />
    </OperationalModuleShell>
  );
}
