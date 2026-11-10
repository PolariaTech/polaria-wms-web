import preciosOpenAIRaw from "./precios-openai.json";

interface PrecioModelo {
  input: number;
  cachedInput: number;
  cacheWrites: number;
  output: number;
}

// Precios reales por token (tier "contexto corto" — precios-openai.json).
const PRECIOS_OPENAI = preciosOpenAIRaw as unknown as Record<
  string,
  PrecioModelo
>;

/**
 * costoUSD = null si el modelo configurado no está en la tabla de precios conocida —
 * nunca se inventa un precio para un modelo que no se puede verificar.
 */
export function calcularCostoUSD(
  model: string,
  tokensEntradaTotal: number,
  tokensCacheados: number,
  tokensCacheEscritura: number,
  tokensSalida: number,
): number | null {
  const precio = PRECIOS_OPENAI[model];
  if (!precio) return null;

  const tokensEntradaNormal = Math.max(
    0,
    tokensEntradaTotal - tokensCacheados - tokensCacheEscritura,
  );
  const costo =
    (tokensEntradaNormal * precio.input +
      tokensCacheados * precio.cachedInput +
      tokensCacheEscritura * precio.cacheWrites +
      tokensSalida * precio.output) /
    1_000_000;

  return Math.round(costo * 1_000_000) / 1_000_000;
}
