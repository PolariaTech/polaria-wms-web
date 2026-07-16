"use client";

import { useRouter } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { ROUTES } from "@/config/routes";
import { PolariaSelectionCard } from "@/components/shared/cards/PolariaSelectionCard";
import { PolariaSelectionGrid } from "@/components/shared/cards/PolariaSelectionGrid";

export function VentasOperadorHub() {
  const router = useRouter();

  return (
    <PolariaSelectionGrid aria-label="Opciones de ventas">
      <PolariaSelectionCard
        option={{
          id: "ordenes-venta",
          title: "Órdenes venta",
          icon: ClipboardList,
        }}
        onClick={() => router.push(ROUTES.dashboardVentasOrdenes)}
      />
    </PolariaSelectionGrid>
  );
}
