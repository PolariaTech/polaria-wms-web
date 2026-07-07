"use client";

import { ROLES_NIVEL_CUENTA } from "@/constants/wms/roles";
import { OperationalModuleShell } from "@/components/shared/module/OperationalModuleShell";
import { BodegaInternaOperadorHub } from "@/modules/processing";

export default function DashboardBodegaInternaCuentaPage() {
  return (
    <OperationalModuleShell
      title="Bodega interna"
      description="Selecciona un flujo operativo de bodega interna."
      gate={{ roles: ROLES_NIVEL_CUENTA }}
    >
      <BodegaInternaOperadorHub />
    </OperationalModuleShell>
  );
}
