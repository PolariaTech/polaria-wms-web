"use client";

import { WMS_MODULE } from "@/constants/permissions";
import {
  ROLES_NIVEL_CUENTA,
  WmsRol,
} from "@/constants/roles";
import { OperationalModuleShell } from "@/components/shared/OperationalModuleShell";
import { TransportePageContent } from "@/modules/transport";

const TRANSPORTE_ROLES = [
  WmsRol.transportista,
  ...ROLES_NIVEL_CUENTA,
  WmsRol.administrador_bodega,
  WmsRol.jefe_bodega,
] as const;

export default function DashboardTransportePage() {
  return (
    <OperationalModuleShell
      title="Transporte"
      description="Guías de envío y evidencias de entrega."
      gate={{
        module: WMS_MODULE.TRANSPORT,
        roles: TRANSPORTE_ROLES,
      }}
    >
      <TransportePageContent />
    </OperationalModuleShell>
  );
}
