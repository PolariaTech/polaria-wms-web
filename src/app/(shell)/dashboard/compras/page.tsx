"use client";

import { WMS_MODULE } from "@/constants/permissions";
import { OperationalModuleShell } from "@/components/shared/OperationalModuleShell";
import { ComprasPageContent } from "@/modules/purchases";

export default function DashboardComprasPage() {
  return (
    <OperationalModuleShell
      title="Compras"
      description="Solicitudes y órdenes de compra de la cuenta activa."
      gate={{ module: WMS_MODULE.PURCHASES }}
    >
      <ComprasPageContent />
    </OperationalModuleShell>
  );
}
