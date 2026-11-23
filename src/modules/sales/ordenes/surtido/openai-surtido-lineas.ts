import type { OrdenTareaAlmacenPrintData } from "../print/orden-tarea-almacen.types";
import type { OrdenSurtidoCapturaPayload } from "./orden-surtido.types";
import { normalizeProductoKey } from "./openai-surtido-campos";
import {
  expandNombresParcialesFirmas,
  sanitizeFacturaAsociada,
} from "./openai-surtido-sanitize";

export type LineaRawCaptura = {
  indice: number;
  productoImpreso: string | null;
  especificacion: string | null;
  cantidadPreparada: string | null;
  codigoIncidencia: string | null;
  nota: string | null;
  alisto: boolean | null;
  reviso: boolean | null;
};

/** Reescribe indice usando productoImpreso del snapshot cuando el modelo desfasó la fila. */
export function remapLineasPorProducto(
  lineas: LineaRawCaptura[],
  original: OrdenTareaAlmacenPrintData,
): OrdenSurtidoCapturaPayload["lineas"] {
  const byKey = new Map<string, number>();
  original.lineas.forEach((linea, index) => {
    const key = normalizeProductoKey(linea.producto || "");
    if (key && !byKey.has(key)) byKey.set(key, index + 1);
  });

  const merged = new Map<number, OrdenSurtidoCapturaPayload["lineas"][number]>();

  for (const row of lineas) {
    let indice = row.indice;
    const productoKey = row.productoImpreso
      ? normalizeProductoKey(row.productoImpreso)
      : "";
    if (productoKey) {
      const matched = byKey.get(productoKey);
      if (matched) {
        indice = matched;
      } else {
        for (const [key, idx] of byKey) {
          if (key.includes(productoKey) || productoKey.includes(key)) {
            indice = idx;
            break;
          }
        }
      }
    }

    const prev = merged.get(indice);
    const mergeBool = (
      a: boolean | null | undefined,
      b: boolean | null | undefined,
    ): boolean | null => {
      if (a === true || b === true) return true;
      if (a === false || b === false) return false;
      return a ?? b ?? null;
    };
    merged.set(indice, {
      indice,
      especificacion: null,
      cantidadPreparada:
        row.cantidadPreparada ?? prev?.cantidadPreparada ?? null,
      codigoIncidencia: row.codigoIncidencia ?? prev?.codigoIncidencia ?? null,
      nota: row.nota ?? prev?.nota ?? null,
      alisto: mergeBool(row.alisto, prev?.alisto),
      reviso: mergeBool(row.reviso, prev?.reviso),
    });
  }

  return [...merged.values()].sort((a, b) => a.indice - b.indice);
}

/**
 * REQ-153: garantiza una fila por producto del snapshot (1..n).
 * Sin esto el reporte de Alistó incompleto pelea con filas omitidas por la IA.
 */
export function ensureLineasCompletas(
  original: OrdenTareaAlmacenPrintData,
  lineas: OrdenSurtidoCapturaPayload["lineas"],
): OrdenSurtidoCapturaPayload["lineas"] {
  const byIndex = new Map(
    lineas.map((linea) => [linea.indice, linea] as const),
  );
  const out: OrdenSurtidoCapturaPayload["lineas"] = [];
  const n = original.lineas.length;
  for (let indice = 1; indice <= n; indice += 1) {
    const prev = byIndex.get(indice);
    out.push(
      prev ?? {
        indice,
        especificacion: null,
        cantidadPreparada: null,
        codigoIncidencia: null,
        nota: null,
        alisto: false,
        reviso: false,
      },
    );
  }
  return out;
}

export function refineSurtidoPayload(
  payload: OrdenSurtidoCapturaPayload,
): OrdenSurtidoCapturaPayload {
  const campos = { ...payload.campos };
  sanitizeFacturaAsociada(campos);
  expandNombresParcialesFirmas(campos);
  return { ...payload, campos };
}