"use client";

import { ROLES_NIVEL_CUENTA } from "@/constants/wms/roles";
import { OperationalModuleShell } from "@/components/shared/module/OperationalModuleShell";
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
