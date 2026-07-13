/** Base fija (g) al definir secundarios por peso neto por unidad (igual que frio). */
export const CATALOGO_REGLA_PRIMARIO_BASE_GRAMOS = 1000;

export const CATALOGO_BASE_PRIMARIO_LABEL = `${CATALOGO_REGLA_PRIMARIO_BASE_GRAMOS} g`;

export function parseGramosPorUnidadInput(value: string): number | null {
  const parsed = Number(String(value).replace(",", ".").trim());
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

export function parseMermaPctInput(value: string): number | null {
  const parsed = Number(String(value).replace(",", ".").trim());
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) return null;
  return parsed;
}

/** Unidades de secundario por kg de primario: 1000 g / g por unidad. */
export function calcUnidadesPorKgPrimario(gramosPorUnidad: number): number | null {
  if (!Number.isFinite(gramosPorUnidad) || gramosPorUnidad <= 0) return null;
  const unidades = CATALOGO_REGLA_PRIMARIO_BASE_GRAMOS / gramosPorUnidad;
  return Number.isFinite(unidades) && unidades > 0 ? unidades : null;
}

export function formatUnidadesPorKgPrimario(unidades: number): string {
  if (!Number.isFinite(unidades)) return "—";
  if (unidades >= 10) {
    return Math.round(unidades).toLocaleString("es-CO");
  }
  return (Math.round(unidades * 100) / 100).toLocaleString("es-CO");
}

/** Aplica merma (%) al estimado teórico de unidades por kg. */
export function aplicarMermaUnidades(
  unidades: number,
  mermaPct: number,
): number | null {
  if (!Number.isFinite(unidades) || unidades < 0) return null;
  if (!Number.isFinite(mermaPct) || mermaPct <= 0) return unidades;
  const pct = Math.min(100, Math.max(0, mermaPct));
  const resultado = unidades * (1 - pct / 100);
  return Number.isFinite(resultado) ? resultado : null;
}

export interface CatalogoConversionPreview {
  gramosPorUnidad: number;
  unidadesPorKg: number;
  unidadesPorKgConMerma: number | null;
  mermaPct: number;
}

export function buildCatalogoConversionPreview(
  gramosInput: string,
  mermaInput: string,
): CatalogoConversionPreview | null {
  const gramosPorUnidad = parseGramosPorUnidadInput(gramosInput);
  if (gramosPorUnidad === null) return null;

  const unidadesPorKg = calcUnidadesPorKgPrimario(gramosPorUnidad);
  if (unidadesPorKg === null) return null;

  const mermaParsed = parseMermaPctInput(mermaInput);
  const mermaPct = mermaParsed ?? 0;

  return {
    gramosPorUnidad,
    unidadesPorKg,
    unidadesPorKgConMerma:
      mermaParsed !== null && mermaParsed > 0
        ? aplicarMermaUnidades(unidadesPorKg, mermaParsed)
        : null,
    mermaPct,
  };
}
