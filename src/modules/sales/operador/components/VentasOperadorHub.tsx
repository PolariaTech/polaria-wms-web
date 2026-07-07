"use client";

import { useRouter } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { ROUTES } from "@/config/routes";
import { PolariaSelectionCard } from "@/components/shared/cards/PolariaSelectionCard";

export function VentasOperadorHub() {
  const router = useRouter();

  return (
    <section
      aria-label="Opciones de ventas"
      className="flex w-full justify-center"
    >
      <div className="w-full max-w-xs sm:max-w-sm">
        <PolariaSelectionCard
          option={{
            id: "ordenes-venta",
            title: "Órdenes venta",
            icon: ClipboardList,
          }}
          onClick={() => router.push(ROUTES.dashboardVentasOrdenes)}
        />
      </div>
    </section>
  );
}
