import { OperationalModuleShell } from "@/components/shared/module/OperationalModuleShell";
import { ROLES_NIVEL_CUENTA } from "@/constants/wms/roles";
import { CorreosTable } from "@/modules/sales/correos/components/CorreosTable";

export default function DashboardVentasCorreosDescartadosPage() {
  return (
    <OperationalModuleShell
      title="Correos descartados"
      description="Correos que el flujo no ingresó. Si alguno sí era un pedido, ingrésalo como OV."
      gate={{ roles: ROLES_NIVEL_CUENTA }}
    >
      <CorreosTable key="descartados" modo="descartados" />
    </OperationalModuleShell>
  );
}
