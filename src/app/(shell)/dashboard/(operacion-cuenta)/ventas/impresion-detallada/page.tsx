"use client";

import dynamic from "next/dynamic";

const ImpresionBatchPageContent = dynamic(
  () =>
    import("@/modules/sales/ordenes/print-batch/ImpresionBatchPageContent").then(
      (m) => ({ default: m.ImpresionBatchPageContent }),
    ),
  { ssr: false, loading: () => null },
);

export default function DashboardVentasImpresionDetalladaPage() {
  return <ImpresionBatchPageContent />;
}
