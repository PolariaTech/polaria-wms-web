"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { EstadoBodegaSlot } from "../types/estado-bodega.types";

interface EstadoBodegaSlotCellProps {
  slot: EstadoBodegaSlot;
  accentClassName: string;
  size: number;
}

export function EstadoBodegaSlotCell({
  slot,
  accentClassName,
  size,
}: EstadoBodegaSlotCellProps) {
  const isEmpty = slot.visual === "vacia";

  return (
    <div
      style={{ width: size, height: size }}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-xl border px-1 py-1 text-center",
        isEmpty && "border-dashed border-polaria-w-20 bg-polaria-t-08",
        slot.visual === "ocupada_primario" &&
          cn(
            "border-polaria-teal bg-polaria-t-08 polaria-teal-glow",
            accentClassName,
          ),
        slot.visual === "ocupada_procesado" &&
          "border-polaria-t-20 bg-[var(--aurora-blue)]",
      )}
    >
      <span className="absolute left-1.5 top-1.5 polaria-text-caption text-polaria-w-50">
        {slot.slotNumber}
      </span>

      {isEmpty ? (
        <>
          <Plus
            className="mb-0.5 h-3.5 w-3.5 text-polaria-w-20"
            strokeWidth={1.75}
            aria-hidden
          />
          <span className="polaria-text-caption text-polaria-w-20">Vacía</span>
        </>
      ) : (
        <div className="flex flex-col items-center gap-0.5 px-1 pt-2">
          <span className="polaria-text-caption font-medium text-polaria-w">
            {slot.codigo ?? "—"}
          </span>
          {slot.productoLabel ? (
            <span className="polaria-text-caption text-polaria-w-50">
              {slot.productoLabel}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
