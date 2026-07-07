"use client";

import { ROLES_NIVEL_CUENTA } from "@/constants/wms/roles";
import { OperationalModuleShell } from "@/components/shared/module/OperationalModuleShell";
import { IntegracionBodegaPageContent } from "@/modules/account-integration";

export default function DashboardBodegaExternaCuentaIntegracionPage() {
  return (
    <OperationalModuleShell
      title="Integración"
      description="Solicitudes de integración con bodegas externas."
      gate={{ roles: ROLES_NIVEL_CUENTA }}
    >
      <IntegracionBodegaPageContent />
    </OperationalModuleShell>
  );
}
