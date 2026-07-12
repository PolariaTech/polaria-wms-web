"use client";

import { Box, Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { EstadoBodegaSlot } from "../types/estado-bodega.types";

interface EstadoBodegaSlotCellProps {
  slot: EstadoBodegaSlot;
  accentClassName: string;
  size: number;
  onSelect?: (slot: EstadoBodegaSlot) => void;
}

function truncateLabel(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1))}…`;
}

export function EstadoBodegaSlotCell({
  slot,
  accentClassName,
  size,
  onSelect,
}: EstadoBodegaSlotCellProps) {
  const isEmpty = slot.visual === "vacia";
  const detalle = slot.detalle;
  const canOpen = !isEmpty && Boolean(detalle) && Boolean(onSelect);
  const compact = size < 88;
  const nameMax = compact ? 8 : 12;
  const idMax = compact ? 8 : 11;

  const content = (
    <>
      <span
        className={cn(
          "absolute left-1 top-1 z-10 polaria-text-caption font-bold tabular-nums text-polaria-w-50",
          compact && "left-0.5 top-0.5 text-[10px] leading-none",
        )}
      >
        {slot.slotNumber}
      </span>

      {isEmpty ? (
        <>
          <Plus
            className="mb-0.5 h-3.5 w-3.5 text-polaria-w-50"
            strokeWidth={1.75}
            aria-hidden
          />
          <span className="polaria-text-caption font-bold text-polaria-w-50">
            Vacía
          </span>
        </>
      ) : (
        <div
          className={cn(
            "flex w-full flex-col items-stretch",
            compact ? "gap-0.5 px-0.5 pt-2.5" : "gap-1 px-1 pt-3",
          )}
        >
          <div className="flex min-w-0 items-start gap-1">
            <Box
              className={cn(
                "mt-0.5 shrink-0 text-polaria-teal",
                compact ? "h-2.5 w-2.5" : "h-3 w-3",
              )}
              strokeWidth={1.75}
              aria-hidden
            />
            <span
              className={cn(
                "min-w-0 flex-1 truncate font-bold leading-tight text-polaria-w",
                compact ? "text-[9px]" : "polaria-text-caption",
              )}
              title={detalle?.productoNombre ?? slot.productoLabel ?? undefined}
            >
              {truncateLabel(
                detalle?.productoNombre ?? slot.productoLabel ?? "Producto",
                nameMax,
              )}
            </span>
          </div>

          <span
            className={cn(
              "truncate font-bold text-polaria-w-50",
              compact ? "pl-0 text-[8px] leading-tight" : "pl-4 polaria-text-caption",
            )}
            title={detalle?.idPaquete ?? undefined}
          >
            {detalle?.idPaquete
              ? truncateLabel(detalle.idPaquete, idMax)
              : "—"}
          </span>

          {detalle?.temperatura ? (
            <span
              className={cn(
                "mx-auto inline-flex max-w-full truncate rounded-full border border-polaria-t-20 bg-polaria-t-08 font-bold text-polaria-teal",
                compact
                  ? "mt-0.5 px-1.5 py-0.5 text-[8px] leading-none"
                  : "mt-0.5 px-2 py-0.5 polaria-text-caption",
              )}
            >
              {detalle.temperatura}
            </span>
          ) : null}
        </div>
      )}
    </>
  );

  const className = cn(
    "relative flex flex-col items-center justify-center rounded-xl border text-center",
    compact ? "px-0.5 py-0.5" : "px-1 py-1",
    isEmpty && "border-dashed border-polaria-w-20 bg-polaria-w-08",
    slot.visual === "ocupada_primario" &&
      cn(
        "border-polaria-t-20 bg-[var(--aurora-teal)]",
        accentClassName,
      ),
    slot.visual === "ocupada_procesado" &&
      "border-polaria-t-20 bg-[var(--aurora-blue)]",
    canOpen &&
      "cursor-pointer transition hover:border-polaria-teal hover:bg-[color-mix(in_srgb,var(--aurora-teal)_70%,var(--t08))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
  );

  if (canOpen) {
    return (
      <button
        type="button"
        style={{ width: size, height: size }}
        className={className}
        onClick={() => onSelect?.(slot)}
        aria-label={`Ver detalle del slot ${slot.slotNumber}`}
      >
        {content}
      </button>
    );
  }

  return (
    <div style={{ width: size, height: size }} className={className}>
      {content}
    </div>
  );
}
