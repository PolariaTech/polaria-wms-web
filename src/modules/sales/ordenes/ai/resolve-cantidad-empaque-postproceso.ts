import { calcularCantidadDesdeCajas } from "../utils/pedido/empaque-lineas";

function cantidadesCasiIguales(a: number, b: number): boolean {
  return Math.abs(a - b) <= 0.05 || Math.abs(a - b) / Math.max(a, b) <= 0.02;
}

/**
 * REQ-369: prioriza cantidad total explícita de la IA sobre cajas×presentación.
 * Si Mateo inventa cajas (p. ej. 20 × Caja 1.5 kg = 30) con cantidad 3 KG del PDF,
 * el cálculo de empaque no debe pisar el 3; además se anulan cajas/presentación
 * contradictorias para que el empaque posterior no vuelva a multiplicar.
 */
export function resolverCantidadEmpaqueLineaPostproceso(linea: {
  cantidad: number | null | undefined;
  cajas: number | null | undefined;
  presentacion: string | null | undefined;
}): {
  cantidad: number | null;
  cajas: number | null;
  presentacion: string | null;
} {
  const cajas = linea.cajas ?? null;
  const presentacion = linea.presentacion?.trim() || null;
  const cantidadIa =
    linea.cantidad != null &&
    Number.isFinite(linea.cantidad) &&
    linea.cantidad > 0
      ? linea.cantidad
      : null;
  const desdeCajas = calcularCantidadDesdeCajas(cajas, presentacion);

  if (cantidadIa != null) {
    if (desdeCajas != null && cantidadesCasiIguales(cantidadIa, desdeCajas)) {
      return { cantidad: desdeCajas, cajas, presentacion };
    }
    // Total explícito manda. Si hay cajas que no cuadran (o sin peso parseable
    // — el UI asumiría 1.5 kg), no las propagamos.
    if (
      cajas != null &&
      (desdeCajas == null || !cantidadesCasiIguales(cantidadIa, desdeCajas))
    ) {
      return { cantidad: cantidadIa, cajas: null, presentacion: null };
    }
    return { cantidad: cantidadIa, cajas, presentacion };
  }

  return {
    cantidad: desdeCajas,
    cajas,
    presentacion,
  };
}
