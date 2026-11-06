import type { OrdenVentaOperadorRow } from "../../shared/types/sales.types";
import { fetchOrdenVentaLog } from "../services/orden-venta-log.client";

/** Cuántos logs se leen a la vez: rápido sin saturar el límite de peticiones del api. */
const LOGS_EN_PARALELO = 4;

type EjecutarEnCuenta = <T>(tarea: () => Promise<T>) => Promise<T>;

/** Mismo criterio de REQ-137: el log de la OV trae una impresión (manual o automática). */
export function logTieneImpresion(entradas: readonly { payloadTipo?: string | null }[]): boolean {
  return entradas.some((entrada) => {
    const tipo = (entrada.payloadTipo ?? "").trim();
    return tipo === "impresion_pdf" || tipo === "impresion_pdf_auto";
  });
}

/**
 * Ids de las OV que ya se imprimieron alguna vez. Si el log de una OV no se puede leer se
 * da por no impresa: es mejor ofrecer de más (el operador ve la lista) que dejar una sin sacar.
 */
export async function idsOvYaImpresas(input: {
  codigoCuenta: string;
  rows: readonly OrdenVentaOperadorRow[];
  runScoped: EjecutarEnCuenta;
  onProgreso?: (leidas: number, total: number) => void;
}): Promise<Set<string>> {
  const { codigoCuenta, rows, runScoped, onProgreso } = input;
  const impresas = new Set<string>();
  let siguiente = 0;
  let leidas = 0;

  async function trabajador(): Promise<void> {
    while (siguiente < rows.length) {
      const row = rows[siguiente]!;
      siguiente += 1;
      try {
        const log = await runScoped(() =>
          fetchOrdenVentaLog({ codigoCuenta, idOrdenVenta: row.idOrdenVenta }),
        );
        if (logTieneImpresion(log)) impresas.add(row.idOrdenVenta);
      } catch {
        // Sin log se trata como no impresa.
      }
      leidas += 1;
      onProgreso?.(leidas, rows.length);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(LOGS_EN_PARALELO, rows.length) }, trabajador),
  );
  return impresas;
}
