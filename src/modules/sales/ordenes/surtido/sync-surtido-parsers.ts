/** Patch de columnas flat de public.orden_venta (solo claves con valor). */
export type OrdenVentaSurtidoFlatPatch = {
  turno?: string;
  hora_salida?: string;
  chofer?: string;
  unidad?: string;
  centro_consumo?: string;
  fecha_entrega?: string;
  orden_compra_hotel?: string;
  direccion_entrega?: string;
  notas_almacen?: string;
  notas_lineas?: string;
  observaciones?: string;
};

export type OrdenVentaLineaSurtidoPatch = {
  indice: number;
  cantidadDespachada: number;
  notaLinea?: string;
};

export function nonEmptySurtido(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}

/** Extrae un número usable de textos tipo "5 kg", "5,0", "12.5 kilos". */
export function parseCantidadPreparadaKg(
  raw: string | null | undefined,
): number | null {
  const text = raw?.trim() ?? "";
  if (!text) return null;
  const normalized = text.replace(",", ".");
  const match = normalized.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const value = Number.parseFloat(match[0]);
  if (!Number.isFinite(value) || value < 0) return null;
  return value;
}

/** Convierte fecha manuscrita (DD/MM/YYYY o ISO) a YYYY-MM-DD. */
export function parseFechaManuscritaToIso(
  raw: string | null | undefined,
): string | null {
  const text = raw?.trim() ?? "";
  if (!text) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const match = text.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (!match) return null;
  const day = match[1]!.padStart(2, "0");
  const month = match[2]!.padStart(2, "0");
  const yearRaw = match[3]!;
  const year =
    yearRaw.length === 2
      ? Number(yearRaw) >= 70
        ? `19${yearRaw}`
        : `20${yearRaw}`
      : yearRaw;
  const iso = `${year}-${month}-${day}`;
  const parsed = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return iso;
}

export function appendUniqueBlockSurtido(base: string, block: string): string {
  const current = base.trim();
  const next = block.trim();
  if (!next) return current;
  if (!current) return next;
  if (current.includes(next)) return current;
  return `${current}\n\n${next}`;
}