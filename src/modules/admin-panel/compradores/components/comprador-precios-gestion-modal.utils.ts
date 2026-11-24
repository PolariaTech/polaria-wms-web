"use client";

import { cn } from "@/lib/utils/cn";

export const ACTION_BUTTON_CLASS = cn(
  "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3",
  "polaria-text-body-sm font-semibold transition",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
);

/** Botón secundario (borde teal) usado en todos los pasos del modal. */
export const ACTION_BUTTON_SECONDARY_CLASS = cn(
  ACTION_BUTTON_CLASS,
  "border border-polaria-t-20 text-polaria-teal hover:bg-polaria-t-08",
  "disabled:cursor-not-allowed disabled:opacity-60",
);

/** Botón primario (fondo teal) para confirmar acciones. */
export const ACTION_BUTTON_PRIMARY_CLASS = cn(
  ACTION_BUTTON_CLASS,
  "bg-polaria-teal text-polaria-on-teal hover:opacity-90",
  "disabled:cursor-not-allowed disabled:opacity-60",
);

export type ModalStep = "acciones" | "exportar" | "imprimir" | "importar-preview";

export function toggleValue(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function firstDayOfMonthIso(): string {
  return new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .slice(0, 10);
}

export function formatPrecioPreview(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value);
}

export function modalStepDescription(step: ModalStep): string {
  if (step === "imprimir") {
    return "Elige grupos y/o compradores adicionales (con lupa). Se descarga Excel.";
  }
  if (step === "exportar") {
    return "Elige periodo, grupos y productos antes de exportar.";
  }
  if (step === "importar-preview") {
    return "Revisa una muestra del Excel antes de confirmar la importación.";
  }
  return "Elige una acción para la plantilla de precios.";
}

export function modalStepSize(step: ModalStep): "sm" | "md" | "2xl" {
  if (step === "acciones") return "sm";
  if (step === "importar-preview") return "2xl";
  return "md";
}
