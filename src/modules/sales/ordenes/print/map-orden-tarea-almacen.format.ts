import { formatIsoToDdMonYyyy } from "@/lib/utils/fecha-dd-mm-yyyy";
import {
  getCuentaZonaHorariaOption,
  resolveCuentaZonaHorariaId,
} from "@/modules/configurator/cuentas/constants/cuenta-zona-horaria";
import type { OrdenTareaAlmacenPrintData } from "./orden-tarea-almacen.types";
import { diaSemanaEntregaEs } from "../utils/pedido/dia-semana-entrega";

export { diaSemanaEntregaEs };

/**
 * Formato meta del PDF: DD-MMM-AAAA HH:mm en zona de la cuenta (default Cancún).
 * REQ-320. No usa la zona del PC.
 */
export function formatOrdenTareaImpresaAt(
  date: Date,
  timeZone: string = "America/Cancun",
): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  const iso = `${get("year")}-${get("month")}-${get("day")}`;
  const fecha = formatIsoToDdMonYyyy(iso);
  return fecha ? `${fecha} ${get("hour")}:${get("minute")}` : "";
}

/**
 * Fecha/hora de creación de la OV (`created_at`).
 * No usa la hora de impresión como fallback (evitar Creada ≈ Impresa).
 */
export function resolveOrdenTareaCreadaAt(input: {
  createdAt?: string | null;
  fechaPedido?: string | null;
}): Date | null {
  for (const raw of [input.createdAt, input.fechaPedido]) {
    if (!raw?.trim()) continue;
    const date = new Date(raw);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return null;
}

/** Marca «Impresa» con el instante actual (al generar/imprimir el PDF). */
export function stampOrdenTareaImpresaNow(
  sheets: readonly OrdenTareaAlmacenPrintData[],
  at: Date = new Date(),
  timeZone: string = "America/Cancun",
): OrdenTareaAlmacenPrintData[] {
  const zonaId = resolveCuentaZonaHorariaId(timeZone);
  const impresa = formatOrdenTareaImpresaAt(at, zonaId);
  const zonaImpresionLabel = getCuentaZonaHorariaOption(zonaId).shortLabel;
  return sheets.map((sheet) => ({
    ...sheet,
    impresa,
    zonaImpresionLabel: sheet.zonaImpresionLabel || zonaImpresionLabel,
  }));
}

/** Texto meta del PDF: creación + impresión. */
export function formatOrdenTareaPageMeta(input: {
  creada: string;
  impresa: string;
  /** Ej. "hora de Cancún" */
  zonaLabel?: string;
}): string {
  const creada = input.creada.trim();
  const impresa = input.impresa.trim();
  const zona = input.zonaLabel?.trim() || "";
  const zonaSuffix = zona ? ` (${zona})` : "";
  if (creada && impresa) {
    return `Creada ${creada}  ·  Impresa ${impresa}${zonaSuffix}`;
  }
  if (creada) return `Creada ${creada}${zonaSuffix}`;
  if (impresa) return `Impresa ${impresa}${zonaSuffix}`;
  return "";
}

export function formatOrdenTareaMetaLabel(data: {
  tareaIndex?: number;
  tareaTotal?: number;
}): string {
  const index = data.tareaIndex && data.tareaIndex > 0 ? data.tareaIndex : 1;
  const total = data.tareaTotal && data.tareaTotal > 0 ? data.tareaTotal : 1;
  return `Orden de tarea ${index}/${total}`;
}