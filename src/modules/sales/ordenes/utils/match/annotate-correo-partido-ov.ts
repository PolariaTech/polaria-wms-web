import { parseOrigenArchivos } from "../origen/origen-adjuntos";

/**
 * El uuid del envío va en la ruta (`cuenta/uuid-nombre`); une OV del mismo correo (REQ-313/338/361).
 * Se compara solo el uuid, porque tras dividir por OC cada OV hermana guarda solo sus propios adjuntos.
 */
const UUID_EN_RUTA =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export type OvCorreoPartidoCandidate = {
  idOrdenVenta: string;
  codigo: string;
  origenArchivos?: string | null;
  estado?: string | null;
};

export type OvCorreoPartidoAnnotation = {
  correoPartido: boolean;
  /** Códigos de las otras OV del mismo correo. */
  correoPartidoDe: string[];
};

/** UUID del envío (en minúsculas), o null si el origen es legado / vacío. */
export function claveEnvioDesdeOrigenArchivos(
  origenArchivos: string | null | undefined,
): string | null {
  for (const adjunto of parseOrigenArchivos(origenArchivos)) {
    const match = UUID_EN_RUTA.exec(adjunto.path?.trim() ?? "");
    if (match) return match[0].toLowerCase();
  }
  return null;
}

/** Texto del tooltip en listado (REQ-338). */
export function tooltipCorreoPartidoListado(input: {
  totalHermanas: number;
  otrasCodigos: readonly string[];
}): string {
  const otras =
    input.otrasCodigos.length > 0
      ? ` Las otras: ${input.otrasCodigos.join(", ")}.`
      : "";
  return `Este correo se partió en ${input.totalHermanas} OV, una por orden de compra.${otras}`;
}

/**
 * REQ-338: marca OV del listado que comparten el mismo envío (adjunto con uuid).
 * Solo ve el lote cargado (misma ventana que potencial duplicado).
 */
export function annotateCorreoPartidoOv(
  rows: readonly OvCorreoPartidoCandidate[],
): Map<string, OvCorreoPartidoAnnotation> {
  const result = new Map<string, OvCorreoPartidoAnnotation>();
  for (const row of rows) {
    result.set(row.idOrdenVenta, {
      correoPartido: false,
      correoPartidoDe: [],
    });
  }

  const byClave = new Map<string, OvCorreoPartidoCandidate[]>();
  for (const row of rows) {
    if ((row.estado ?? "").toLowerCase() === "cancelada") continue;
    const clave = claveEnvioDesdeOrigenArchivos(row.origenArchivos);
    if (!clave) continue;
    const group = byClave.get(clave) ?? [];
    group.push(row);
    byClave.set(clave, group);
  }

  for (const group of byClave.values()) {
    if (group.length < 2) continue;
    const codigos = group.map((row) => row.codigo).sort();
    for (const row of group) {
      const ann = result.get(row.idOrdenVenta);
      if (!ann) continue;
      ann.correoPartido = true;
      ann.correoPartidoDe = codigos.filter((codigo) => codigo !== row.codigo);
    }
  }

  return result;
}
