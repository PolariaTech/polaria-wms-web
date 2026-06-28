"use client";

import { ROLES_NIVEL_CUENTA } from "@/constants/roles";
import { OperationalModuleShell } from "@/components/shared/OperationalModuleShell";
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
