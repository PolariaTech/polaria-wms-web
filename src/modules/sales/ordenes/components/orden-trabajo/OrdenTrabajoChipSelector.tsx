"use client";

import { cn } from "@/lib/utils/cn";
import { capturaTieneDespacho } from "../../surtido/compute-estado-alistamiento";
import type { OrdenSurtidoCapturaPayload } from "../../surtido/orden-surtido.types";
import { normalizeIdOrdenTrabajo } from "../../utils/origen/origen-correo-ordenes-trabajo";

export type OrdenTrabajoChipItem = {
  id: string;
  /** Texto completo para title / aria (no se muestra en el chip). */
  label: string;
};

type CapturaMap = Map<string, { payload?: OrdenSurtidoCapturaPayload }>;

/** REQ-243: aviso si falta check-in Despachó escaneado. */
export function CheckinDespachoAviso({
  ots,
  capturaByOt,
}: {
  ots: ReadonlyArray<{ id: string }>;
  capturaByOt: CapturaMap;
}) {
  const falta = ots.some((hija) => {
    const key = normalizeIdOrdenTrabajo(hija.id);
    const captura = capturaByOt.get(key) ?? capturaByOt.get("");
    return !capturaTieneDespacho(captura?.payload);
  });
  if (!falta) return null;
  return (
    <p className="rounded-xl border border-polaria-danger-border bg-polaria-danger-bg px-3 py-2 polaria-text-caption text-polaria-danger">
      Check-in al despacho: escaneá la hoja desde la app (caja Despachó) antes de
      armar el paquete o mover a salida. Sin ese escaneo no se puede despachar.
    </p>
  );
}

/** Aviso de chulos Alistó incompletos con lectura confiable. */
export function AlistoIncompletoAviso({
  lineasProductoTotal,
  lineasAlistoTotal,
  capturaByOt,
}: {
  lineasProductoTotal: number;
  lineasAlistoTotal: number;
  capturaByOt: CapturaMap;
}) {
  const confiable =
    lineasProductoTotal > 0 &&
    lineasAlistoTotal < lineasProductoTotal &&
    [...capturaByOt.values()].some(
      (c) => (c.payload?.precisionEstimada ?? 0) >= 60,
    );
  if (!confiable) return null;
  return (
    <p className="rounded-xl border border-polaria-warning-border bg-polaria-warning-bg px-3 py-2 polaria-text-caption text-polaria-warning">
      La lectura parece confiable, pero faltan chulos Alistó en algunas filas.
      Revisa la foto o vuelve a capturar esa OT.
    </p>
  );
}

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
            title={item.label || `TAREA ${n}`}
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
