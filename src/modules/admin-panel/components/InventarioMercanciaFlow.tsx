"use client";

import type { LucideIcon } from "lucide-react";
import {
  Factory,
  LayoutGrid,
  Package,
  ShoppingCart,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { InventarioMercanciaEtapaId } from "../services/inventario-mercancia-report.service";
import { formatInventarioKg } from "../services/inventario-mercancia-report.service";

const STAGE_ICONS: Record<InventarioMercanciaEtapaId, LucideIcon> = {
  proveedor: LayoutGrid,
  transporte: Truck,
  bodega_interna: Package,
  bodega_externa: Factory,
  ventas: ShoppingCart,
};

function FlowLine({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "border-polaria-w-20",
        className,
      )}
      aria-hidden
    />
  );
}

interface InventarioStageCardProps {
  id: InventarioMercanciaEtapaId;
  label: string;
  kg: number;
  highlighted?: boolean;
}

function InventarioStageCard({
  id,
  label,
  kg,
  highlighted = false,
}: InventarioStageCardProps) {
  const Icon = STAGE_ICONS[id];

  return (
    <div
      className={cn(
        "flex w-full min-w-[10rem] max-w-[14rem] items-center gap-3 rounded-xl border bg-polaria-w-08 px-4 py-3",
        highlighted
          ? "border-polaria-teal shadow-[0_0_20px_var(--teal-glow)]"
          : "border-polaria-w-08",
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
          highlighted
            ? "border-polaria-t-20 bg-polaria-t-08"
            : "border-polaria-w-08 bg-polaria-bg",
        )}
      >
        <Icon
          className={cn(
            "h-5 w-5",
            highlighted ? "text-polaria-teal" : "text-polaria-w-50",
          )}
          strokeWidth={1.5}
          aria-hidden
        />
      </div>
      <p className="polaria-text-body-sm text-polaria-w">
        <span className="font-medium">{label}</span>{" "}
        <span className={highlighted ? "text-polaria-teal" : "text-polaria-w-50"}>
          ({formatInventarioKg(kg)} Kg)
        </span>
      </p>
    </div>
  );
}

interface InventarioMercanciaFlowProps {
  proveedorKg: number;
  transporteKg: number;
  bodegaInternaKg: number;
  bodegaExternaKg: number;
  ventasKg: number;
  highlightedStageId: InventarioMercanciaEtapaId | null;
}

export function InventarioMercanciaFlow({
  proveedorKg,
  transporteKg,
  bodegaInternaKg,
  bodegaExternaKg,
  ventasKg,
  highlightedStageId,
}: InventarioMercanciaFlowProps) {
  return (
    <div className="flex flex-col items-center py-2">
      <InventarioStageCard
        id="proveedor"
        label="Proveedor"
        kg={proveedorKg}
      />

      <FlowLine className="my-1 h-8 w-px border-l border-dashed" />

      <InventarioStageCard
        id="transporte"
        label="Transporte"
        kg={transporteKg}
      />

      <FlowLine className="my-1 h-8 w-px border-l border-dashed" />

      <div className="relative flex w-full max-w-xl items-start justify-between gap-4 px-2 sm:px-6">
        <FlowLine className="absolute left-[16%] right-[16%] top-0 border-t border-dashed" />

        <div className="flex flex-1 flex-col items-center">
          <FlowLine className="mb-1 h-4 w-px border-l border-dashed" />
          <InventarioStageCard
            id="bodega_interna"
            label="Bodega interna"
            kg={bodegaInternaKg}
            highlighted={highlightedStageId === "bodega_interna"}
          />
        </div>

        <div className="flex flex-1 flex-col items-center">
          <FlowLine className="mb-1 h-4 w-px border-l border-dashed" />
          <InventarioStageCard
            id="bodega_externa"
            label="Bodega externa"
            kg={bodegaExternaKg}
            highlighted={highlightedStageId === "bodega_externa"}
          />
        </div>
      </div>

      <FlowLine className="my-1 h-8 w-px border-l border-dashed" />

      <InventarioStageCard id="ventas" label="Ventas" kg={ventasKg} />
    </div>
  );
}
