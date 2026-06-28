"use client";

import { useRouter } from "next/navigation";
import { Settings2 } from "lucide-react";
import { ROUTES } from "@/config/routes";
import { PolariaSelectionCard } from "@/components/shared/PolariaSelectionCard";

export function BodegaInternaOperadorHub() {
  const router = useRouter();

  return (
    <section
      aria-label="Opciones de bodega interna"
      className="flex w-full justify-center"
    >
      <div className="w-full max-w-xs sm:max-w-sm">
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
      </div>
    </section>
  );
}
