"use client";

import { ROLES_NIVEL_CUENTA } from "@/constants/roles";
import { OperationalModuleShell } from "@/components/shared/OperationalModuleShell";
import { OperadorOrdenesVentaPageContent } from "@/modules/sales";

export default function DashboardVentasOrdenesPage() {
  return (
    <OperationalModuleShell
      title="Órdenes venta"
      description="Órdenes de venta manuales de la cuenta."
      gate={{ roles: ROLES_NIVEL_CUENTA }}
    >
      <OperadorOrdenesVentaPageContent />
    </OperationalModuleShell>
  );
}
