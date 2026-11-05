import { parseDecimalEs } from "@/lib/utils/decimal-es";

export type LineaAvanceParseResult =
  | { ok: true; cantidadPedida: number; precioUnitario: number }
  | { ok: false; error: string };

/**
 * REQ-138 / REQ-235: precio vacío o 0 permitido al guardar avance y al confirmar.
 * Al confirmar sigue exigiendo cantidad > 0; precio vacío → 0.
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

  if (precio != null && precio < 0) {
    return {
      ok: false,
      error: `El precio no puede ser negativo en ${nombre}.`,
    };
  }

  const precioUnitario =
    precio != null && Number.isFinite(precio) ? precio : 0;

  if (!params.isDraft) {
    if (cantidadKg === null || cantidadKg <= 0) {
      return {
        ok: false,
        error: `Ingresa una cantidad válida para ${nombre}.`,
      };
    }
    return { ok: true, cantidadPedida: cantidadKg, precioUnitario };
  }

  const cantidadPedida =
    cantidadKg != null && Number.isFinite(cantidadKg) && cantidadKg >= 0
      ? cantidadKg
      : 0;

  return { ok: true, cantidadPedida, precioUnitario };
}
