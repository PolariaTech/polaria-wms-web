"use client";

import { useRouter } from "next/navigation";
import { Plug } from "lucide-react";
import { ROUTES } from "@/config/routes";
import { PolariaSelectionCard } from "@/components/shared/PolariaSelectionCard";

export function BodegaExternaOperadorHub() {
  const router = useRouter();

  return (
    <section
      aria-label="Opciones de bodega externa"
      className="flex w-full justify-center"
    >
      <div className="w-full max-w-xs sm:max-w-sm">
        <PolariaSelectionCard
          option={{
            id: "integracion",
            title: "Integración",
            icon: Plug,
          }}
          onClick={() => router.push(ROUTES.dashboardBodegaExternaCuentaIntegracion)}
        />
      </div>
    </section>
  );
}
