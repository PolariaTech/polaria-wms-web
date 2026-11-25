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

export default function DashboardVentasCorreosDescartadosPage() {
  return (
    <OperationalModuleShell
      title="Correos descartados"
      description="Correos que el flujo no ingresó. Si alguno sí era un pedido, ingrésalo como OV: pasará a Correos procesados."
      gate={{ roles: ROLES_NIVEL_CUENTA }}
      compactoEnPantallaBaja
    >
      <Suspense fallback={<PolariaStatusLoading embedded />}>
        <CorreosTable key="descartados" modo="descartados" />
      </Suspense>
    </OperationalModuleShell>
  );
}
