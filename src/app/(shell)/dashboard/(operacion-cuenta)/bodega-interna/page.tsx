"use client";

import { ROLES_NIVEL_CUENTA } from "@/constants/roles";
import { OperationalModuleShell } from "@/components/shared/OperationalModuleShell";
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
