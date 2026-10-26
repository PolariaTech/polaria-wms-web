import { parseDecimalEs } from "@/lib/utils/decimal-es";

export type LineaAvanceParseResult =
  | { ok: true; cantidadPedida: number; precioUnitario: number }
  | { ok: false; error: string };

/**
 * REQ-138: al guardar avance, cantidad/precio vacíos → 0 (no bloquea).
 * Al confirmar, exige cantidad > 0 y precio informado (≥ 0).
 */
export function resolveCantidadPrecioParaPersistir(params: {
  isDraft: boolean;
  cantidadInput: string;
  precioInput: string;
  nombreProducto: string;
}): LineaAvanceParseResult {
  const nombre = params.nombreProducto.trim() || "el producto";
  const cantidadKg = parseDecimalEs(params.cantidadInput);
  const precio = parseDecimalEs(params.precioInput);

  if (!params.isDraft) {
    if (cantidadKg === null || cantidadKg <= 0) {
      return {
        ok: false,
        error: `Ingresa una cantidad válida para ${nombre}.`,
      };
    }
    if (precio === null) {
      return {
        ok: false,
        error: `Ingresa un precio (0 o mayor) para ${nombre}.`,
      };
    }
    if (precio < 0) {
      return {
        ok: false,
        error: `El precio no puede ser negativo en ${nombre}.`,
      };
    }
    return { ok: true, cantidadPedida: cantidadKg, precioUnitario: precio };
  }

  if (precio != null && precio < 0) {
    return {
      ok: false,
      error: `El precio no puede ser negativo en ${nombre}.`,
    };
  }

  const cantidadPedida =
    cantidadKg != null && Number.isFinite(cantidadKg) && cantidadKg >= 0
      ? cantidadKg
      : 0;
  const precioUnitario =
    precio != null && Number.isFinite(precio) ? precio : 0;

  return { ok: true, cantidadPedida, precioUnitario };
}
