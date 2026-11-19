import { annotateCorreoPartidoOv } from "../../ordenes/utils/match/annotate-correo-partido-ov";
import { annotatePotencialDuplicadoOv } from "../../ordenes/utils/match/find-potencial-duplicado-ov";
import type { OrdenVentaOperadorRow } from "../types/sales.types";

type FilaOrigenListado = {
  id_orden_venta: string;
  codigo: string;
  origen_archivos?: string | null;
  estado?: string | null;
};

/**
 * REQ-151 / REQ-338: anota duplicado potencial y correo partido sobre el lote
 * ya mapeado del listado operador (solo ve lo cargado en pantalla).
 */
export function enrichOperadorListadoAnnotations(
  mapped: OrdenVentaOperadorRow[],
  rows: readonly FilaOrigenListado[],
): OrdenVentaOperadorRow[] {
  const dupMap = annotatePotencialDuplicadoOv(
    mapped.map((row) => ({
      idOrdenVenta: row.idOrdenVenta,
      codigo: row.venta,
      occTodas: row.occTodas,
      comprador: row.comprador,
      fecha: row.fecha,
      estado: row.estado,
    })),
  );
  const partidoMap = annotateCorreoPartidoOv(
    rows.map((row) => ({
      idOrdenVenta: row.id_orden_venta,
      codigo: row.codigo,
      origenArchivos: row.origen_archivos,
      estado: row.estado,
    })),
  );
  return mapped.map((row) => {
    const ann = dupMap.get(row.idOrdenVenta);
    const partido = partidoMap.get(row.idOrdenVenta);
    return {
      ...row,
      ...(ann
        ? {
            potencialDuplicado: ann.potencialDuplicado,
            potencialDuplicadoDe: ann.potencialDuplicadoDe,
          }
        : {}),
      ...(partido
        ? {
            correoPartido: partido.correoPartido,
            correoPartidoDe: partido.correoPartidoDe,
          }
        : {}),
    };
  });
}
