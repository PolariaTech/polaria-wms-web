"use client";

import { ROLES_NIVEL_CUENTA } from "@/constants/roles";
import { OperationalModuleShell } from "@/components/shared/OperationalModuleShell";
import { BodegaExternaOperadorHub } from "@/modules/account-integration";

export default function DashboardBodegaExternaCuentaPage() {
  return (
    <OperationalModuleShell
      title="Bodega externa"
      description="Selecciona un flujo operativo de bodega externa."
      gate={{ roles: ROLES_NIVEL_CUENTA }}
    >
      <BodegaExternaOperadorHub />
    </OperationalModuleShell>
  );
}
