/**
 * Merma operativa sugerida (referencia frio: desperdicioKgSugerido.ts).
 * kg primario × % pérdida del catálogo del secundario.
 */

export interface DesperdicioKgSugeridoInput {
  kilosPrimario: string | number | null | undefined;
  perdidaProcesamientoPct: string | number | null | undefined;
}

export interface DesperdicioSugeridoDetalle {
  desperdicioKg: number | null;
  perdidaPct: number | null;
  kilosPrimario: number | null;
}

function parsePositiveNumber(
  value: string | number | null | undefined,
): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

/** kg de merma sugerida = kilos primario × (perdida % / 100). */
export function desperdicioKgSugeridoDesdeMerma(
  input: DesperdicioKgSugeridoInput,
): number | null {
  const pctRaw = parsePositiveNumber(input.perdidaProcesamientoPct);
  if (pctRaw === null || pctRaw <= 0) return null;

  const pct = Math.min(100, Math.max(0, pctRaw));
  const qty = parsePositiveNumber(input.kilosPrimario);
  if (qty === null || qty <= 0) return null;

  const kg = (qty * pct) / 100;
  if (!Number.isFinite(kg)) return null;
  return Math.round(kg * 10000) / 10000;
}

export function stringKgInicialDesperdicio(kg: number | null | undefined): string {
  if (kg === null || kg === undefined || !Number.isFinite(kg) || kg < 0) {
    return "0";
  }
  return String(kg);
}

export function buildDesperdicioSugeridoDetalle(
  input: DesperdicioKgSugeridoInput,
): DesperdicioSugeridoDetalle {
  const kilosPrimario = parsePositiveNumber(input.kilosPrimario);
  const perdidaPct = parsePositiveNumber(input.perdidaProcesamientoPct);

  return {
    kilosPrimario,
    perdidaPct: perdidaPct !== null && perdidaPct > 0 ? perdidaPct : null,
    desperdicioKg: desperdicioKgSugeridoDesdeMerma(input),
  };
}
