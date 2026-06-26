"use client";

import { WMS_MODULE } from "@/constants/permissions";
import { OperationalModuleShell } from "@/components/shared/OperationalModuleShell";
import { VentasPageContent } from "@/modules/sales";

export default function DashboardVentasPage() {
  return (
    <OperationalModuleShell
      title="Ventas"
      description="Órdenes de venta de la cuenta activa."
      gate={{ module: WMS_MODULE.SALES }}
    >
      <VentasPageContent />
    </OperationalModuleShell>
  );
}
