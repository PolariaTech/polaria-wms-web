"use client";

import { cn } from "@/lib/utils/cn";

export type OrdenTrabajoChipItem = {
  id: string;
  /** Texto completo para title / aria (no se muestra en el chip). */
  label: string;
};

/**
 * Selector compacto de OT: solo el # dentro del pedido (1…N).
 * REQ-223 — sustituye las cards grandes con label/kg/almacén duplicados.
 */
export function OrdenTrabajoChipSelector({
  items,
  selectedId,
  onSelect,
  className,
}: {
  items: OrdenTrabajoChipItem[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  className?: string;
}) {
  if (items.length === 0) return null;

  return (
    <div
      role="listbox"
      aria-label="Órdenes de trabajo"
      className={cn("flex flex-wrap gap-2", className)}
    >
      {items.map((item, index) => {
        const n = index + 1;
        const selected = selectedId === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="option"
            aria-selected={selected}
            aria-label={`Orden de trabajo ${n}${item.label ? `: ${item.label}` : ""}`}
            title={item.label || `OT ${n}`}
            onClick={() => onSelect(item.id)}
            className={cn(
              "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-2.5",
              "polaria-text-body-sm font-semibold tabular-nums transition",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
              selected
                ? "border-polaria-teal bg-polaria-teal text-polaria-on-teal"
                : "border-polaria-t-20 bg-polaria-t-08 text-polaria-w hover:border-polaria-teal hover:bg-polaria-t-20",
            )}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}
