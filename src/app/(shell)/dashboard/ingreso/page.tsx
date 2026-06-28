"use client";

import { ROLES_INGRESO_BODEGA } from "@/constants/roles";
import { OperationalModuleShell } from "@/components/shared/OperationalModuleShell";
import { IngresoPageContent } from "@/modules/purchases";

export default function DashboardIngresoPage() {
  return (
    <OperationalModuleShell
      title="Ingreso"
      description="Recepciones de mercancía contra órdenes de compra."
      gate={{ roles: ROLES_INGRESO_BODEGA }}
    >
      <IngresoPageContent />
    </OperationalModuleShell>
  );
}
