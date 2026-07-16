"use client";

import { useRouter } from "next/navigation";
import { Plug } from "lucide-react";
import { ROUTES } from "@/config/routes";
import { PolariaSelectionCard } from "@/components/shared/cards/PolariaSelectionCard";
import { PolariaSelectionGrid } from "@/components/shared/cards/PolariaSelectionGrid";

export function BodegaExternaOperadorHub() {
  const router = useRouter();

  return (
    <PolariaSelectionGrid aria-label="Opciones de bodega externa">
      <PolariaSelectionCard
        option={{
          id: "integracion",
          title: "Integración",
          icon: Plug,
        }}
        onClick={() =>
          router.push(ROUTES.dashboardBodegaExternaCuentaIntegracion)
        }
      />
    </PolariaSelectionGrid>
  );
}
