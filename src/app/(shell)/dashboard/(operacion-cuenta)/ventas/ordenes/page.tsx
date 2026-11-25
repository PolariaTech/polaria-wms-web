"use client";

import dynamic from "next/dynamic";

const OperadorOrdenesVentaPageContent = dynamic(
  () =>
    import(
      "@/modules/sales/ordenes/components/pages/OperadorOrdenesVentaPageContent"
    ).then((m) => ({ default: m.OperadorOrdenesVentaPageContent })),
  { ssr: false, loading: () => null },
);

export default function DashboardVentasOrdenesPage() {
  return <OperadorOrdenesVentaPageContent />;
}
