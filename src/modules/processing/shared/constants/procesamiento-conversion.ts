/** Lado primario de la relación fijado a 1 kg (igual que frio). */
export const PROCESAMIENTO_RELACION_PRIMARIO_BASE = 1;

export interface ProcesamientoDesgloseEstimado {
  uInt: number;
  sobranteKg: number;
  mermaUnidades: number | null;
  mermaKg: number | null;
}

/**
 * Unidades de secundario según regla de tres (misma fórmula que frio).
 * `cantidadTransformarPrimario` en kg del primario.
 */
export function unidadesSecundarioPorRegla(
  cantidadTransformarPrimario: number,
  reglaCantidadPrimario?: number | null,
  reglaUnidadesSecundario?: number | null,
): number | null {
  const a = Number(reglaCantidadPrimario);
  const b = Number(reglaUnidadesSecundario);
  const q = Number(cantidadTransformarPrimario);
  if (!Number.isFinite(q) || q <= 0 || !Number.isFinite(a) || a <= 0 || !Number.isFinite(b) || b <= 0) {
    return null;
  }
  const raw = (q / a) * b;
  return Number.isFinite(raw) ? raw : null;
}

/** Unidades de secundario por 1 kg de primario según regla del catálogo. */
export function unidadesSecundarioPorKgPrimario(
  reglaCantidadPrimario?: number | null,
  reglaUnidadesSecundario?: number | null,
): number | null {
  return unidadesSecundarioPorRegla(
    PROCESAMIENTO_RELACION_PRIMARIO_BASE,
    reglaCantidadPrimario,
    reglaUnidadesSecundario,
  );
}

/**
 * Aplica merma (%) al estimado teórico de unidades de secundario (igual que frio).
 */
export function estimadoSecundarioAplicarPerdidaPct(
  teorico: number | null,
  perdidaPct: number,
): number | null {
  if (teorico === null || !Number.isFinite(teorico) || teorico < 0) return null;
  const pRaw = Number(perdidaPct);
  if (!Number.isFinite(pRaw) || pRaw <= 0) return teorico;
  const p = Math.min(100, Math.max(0, pRaw));
  const r = teorico * (1 - p / 100);
  return Number.isFinite(r) ? r : null;
}

export function buildProcesamientoDesgloseEstimado(
  estimado: number | null,
  estimadoTeorico: number | null,
  cantidadElegida: number,
): ProcesamientoDesgloseEstimado | null {
  if (estimado === null || !Number.isFinite(estimado) || estimado < 0) return null;

  const uInt = Math.max(0, Math.floor(estimado + 1e-9));
  const frac = Math.max(0, estimado - uInt);
  const kgPorU = estimado > 1e-12 ? cantidadElegida / estimado : 0;
  const sobranteKg = frac * kgPorU;

  let mermaUnidades: number | null = null;
  let mermaKg: number | null = null;
  if (
    estimadoTeorico !== null &&
    Number.isFinite(estimadoTeorico) &&
    estimadoTeorico >= 0
  ) {
    mermaUnidades = Math.max(0, estimadoTeorico - estimado);
    mermaKg =
      estimadoTeorico > 1e-12
        ? mermaUnidades * (cantidadElegida / estimadoTeorico)
        : 0;
  }

  return { uInt, sobranteKg, mermaUnidades, mermaKg };
}

export function maxCantidadProcesamientoDesdeStock(stockKg: number): number {
  if (!Number.isFinite(stockKg) || stockKg <= 0) return 0;
  return Math.max(0, Math.floor(stockKg));
}
