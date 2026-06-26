"use client";

import { OperationalModuleShell } from "@/components/shared/OperationalModuleShell";
import { IngresoPageContent } from "@/modules/purchases";

export default function DashboardIngresoPage() {
  return (
    <OperationalModuleShell
      title="Ingreso"
      description="Solicitudes, órdenes y recepciones de compra de la cuenta activa."
      gate={{ minNivelRol: "bodega" }}
    >
      <IngresoPageContent />
    </OperationalModuleShell>
  );
}
