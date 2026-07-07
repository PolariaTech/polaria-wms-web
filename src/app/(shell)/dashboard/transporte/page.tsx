"use client";

import { WMS_MODULE } from "@/constants/wms/permissions";
import { ROLES_TRANSPORTE } from "@/constants/wms/roles";
import { OperationalModuleShell } from "@/components/shared/module/OperationalModuleShell";
import { TransportePageContent } from "@/modules/transport";

export default function DashboardTransportePage() {
  return (
    <OperationalModuleShell
      title="Transporte"
      description="Guías de envío y evidencias de entrega."
      gate={{
        module: WMS_MODULE.TRANSPORT,
        roles: ROLES_TRANSPORTE,
      }}
    >
      <TransportePageContent />
    </OperationalModuleShell>
  );
}
