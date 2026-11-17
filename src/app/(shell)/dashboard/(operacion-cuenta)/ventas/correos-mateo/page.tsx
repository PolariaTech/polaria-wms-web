import { Suspense } from "react";
import { OperationalModuleShell } from "@/components/shared/module/OperationalModuleShell";
import { PolariaStatusLoading } from "@/components/shared/status/PolariaStatusLoading";
import { ROLES_NIVEL_CUENTA } from "@/constants/wms/roles";
import { CorreosTable } from "@/modules/sales/correos/components/CorreosTable";

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
