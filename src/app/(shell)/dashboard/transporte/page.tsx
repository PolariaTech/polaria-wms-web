"use client";

import dynamic from "next/dynamic";
import { WMS_MODULE } from "@/constants/wms/permissions";
import { ROLES_TRANSPORTE } from "@/constants/wms/roles";
import { OperationalModuleShell } from "@/components/shared/module/OperationalModuleShell";

const TransportePageContent = dynamic(
  () =>
    import("@/modules/transport").then((m) => ({
      default: m.TransportePageContent,
    })),
  { loading: () => null, ssr: false },
);

export default function DashboardTransportePage() {
  return (
    <OperationalModuleShell
      title="Transporte"
      description="Viajes de entrega en curso."
      gate={{
        module: WMS_MODULE.TRANSPORT,
        roles: ROLES_TRANSPORTE,
      }}
    >
      <TransportePageContent />
    </OperationalModuleShell>
  );
}
