"use client";

import { useRouter } from "next/navigation";
import { Settings2 } from "lucide-react";
import { ROUTES } from "@/config/routes";
import { PolariaSelectionCard } from "@/components/shared/cards/PolariaSelectionCard";
import { PolariaSelectionGrid } from "@/components/shared/cards/PolariaSelectionGrid";

export function BodegaInternaOperadorHub() {
  const router = useRouter();

  return (
    <PolariaSelectionGrid aria-label="Opciones de bodega interna">
      <PolariaSelectionCard
        option={{
          id: "procesamiento",
          title: "Procesamiento",
          icon: Settings2,
        }}
        onClick={() =>
          router.push(ROUTES.dashboardBodegaInternaCuentaProcesamiento)
        }
      />
    </PolariaSelectionGrid>
  );
}
