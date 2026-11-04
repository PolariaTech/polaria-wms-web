import {
  groupKeyOrigenCorreo,
  type OrigenCorreoRenglon,
} from "./origen-correo-ordenes-trabajo";

function norm(value: string | undefined): string {
  return value?.trim() || "";
}

/**
 * REQ-201: mapa otId|índice → idProducto ya verificado en origen_correo.
 * Sirve para reaplicar la verificación al rearmar el formulario desde el origen.
 */
export function indexIdProductoVerificadoOrigen(
  rows: readonly OrigenCorreoRenglon[],
): Map<string, string> {
  const out = new Map<string, string>();
  const perOt = new Map<string, number>();
  for (const row of rows) {
    const idProducto = norm(row._idProducto);
    if (!idProducto) continue;
    const otKey = groupKeyOrigenCorreo(row);
    const idx = perOt.get(otKey) ?? 0;
    perOt.set(otKey, idx + 1);
    out.set(`${otKey}#${idx}`, idProducto);
    if (!out.has(`${otKey}#id:${idProducto}`)) {
      out.set(`${otKey}#id:${idProducto}`, idProducto);
    }
  }
  return out;
}
