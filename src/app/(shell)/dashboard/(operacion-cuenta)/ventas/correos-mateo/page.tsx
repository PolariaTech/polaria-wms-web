import { OperationalModuleShell } from "@/components/shared/module/OperationalModuleShell";
import { ROLES_NIVEL_CUENTA } from "@/constants/wms/roles";
import { CorreosTable } from "@/modules/sales/correos/components/CorreosTable";

export default function DashboardVentasCorreosMateoPage() {
  return (
    <OperationalModuleShell
      title="Correos recibidos"
      description="Todos los correos de pedidos que registró el flujo automático."
      gate={{ roles: ROLES_NIVEL_CUENTA }}
      compactoEnPantallaBaja
    >
      <CorreosTable key="todos" modo="todos" />
    </OperationalModuleShell>
  );
}
