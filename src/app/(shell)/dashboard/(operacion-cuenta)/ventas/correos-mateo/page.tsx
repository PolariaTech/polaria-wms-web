"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { OperationalModuleShell } from "@/components/shared/module/OperationalModuleShell";
import { PolariaStatusLoading } from "@/components/shared/status/PolariaStatusLoading";
import { ROLES_NIVEL_CUENTA } from "@/constants/wms/roles";

const CorreosTable = dynamic(
  () =>
    import("@/modules/sales/correos/components/CorreosTable").then((m) => ({
      default: m.CorreosTable,
    })),
  { ssr: false, loading: () => <PolariaStatusLoading embedded /> },
);

export default function DashboardVentasCorreosMateoPage() {
  return (
    <OperationalModuleShell
      title="Correos procesados"
      description="Correos que tomó el flujo automático y los descartados que ya se ingresaron como OV."
      gate={{ roles: ROLES_NIVEL_CUENTA }}
      compactoEnPantallaBaja
    >
      <Suspense fallback={<PolariaStatusLoading embedded />}>
        <CorreosTable key="procesados" modo="procesados" />
      </Suspense>
    </OperationalModuleShell>
  );
}
