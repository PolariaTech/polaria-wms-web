"use client";

import { ROLES_NIVEL_CUENTA } from "@/constants/roles";
import { OperationalModuleShell } from "@/components/shared/OperationalModuleShell";

export default function DashboardIntegracionCuentaPage() {
  return (
    <OperationalModuleShell
      title="Bodega externa"
      description="Integración operativa de bodega externa para la cuenta activa."
      gate={{ roles: ROLES_NIVEL_CUENTA }}
    >
      <p className="polaria-text-body-sm text-polaria-w-50">
        Próximamente: flujos de integración con bodega externa.
      </p>
    </OperationalModuleShell>
  );
}
