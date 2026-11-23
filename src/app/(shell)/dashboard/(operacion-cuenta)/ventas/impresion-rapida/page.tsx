"use client";

import dynamic from "next/dynamic";

const ImpresionRapidaPageContent = dynamic(
  () =>
    import("@/modules/sales/ordenes/print-batch/ImpresionRapidaPageContent").then(
      (m) => ({ default: m.ImpresionRapidaPageContent }),
    ),
  { ssr: false, loading: () => null },
);

export default function DashboardVentasImpresionRapidaPage() {
  return <ImpresionRapidaPageContent />;
}
