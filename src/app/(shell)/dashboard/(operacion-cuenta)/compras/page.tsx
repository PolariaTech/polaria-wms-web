"use client";

import dynamic from "next/dynamic";
import { WMS_MODULE } from "@/constants/wms/permissions";
import { OperationalModuleShell } from "@/components/shared/module/OperationalModuleShell";

const ComprasPageContent = dynamic(
  () =>
    import("@/modules/purchases").then((m) => ({
      default: m.ComprasPageContent,
    })),
  { loading: () => null, ssr: false },
);

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
