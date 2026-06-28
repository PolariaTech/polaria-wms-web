"use client";

import { OperationalModuleShell } from "@/components/shared/OperationalModuleShell";
import { IngresoPageContent } from "@/modules/purchases";

export default function DashboardIngresoPage() {
  return (
    <OperationalModuleShell
      title="Ingreso"
      description="Recepciones de mercancía contra órdenes de compra."
      gate={{ minNivelRol: "bodega" }}
    >
      <IngresoPageContent />
    </OperationalModuleShell>
  );
}
