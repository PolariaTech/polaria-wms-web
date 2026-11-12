import { parseDecimalEs } from "@/lib/utils/decimal-es";
import type { OrigenCorreoRenglon } from "../origen/origen-correo-ordenes-trabajo";
import { afinidadDeNombres } from "../origen/identidad-nombres-producto";

/** Lo mínimo que se necesita de una línea ya guardada para saber de qué renglón viene. */
export type LineaParaEmparejar = {
  idProducto: string;
  nombre: string;
  codigo: string;
  cantidadInput: string;
};

function norm(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function cantidadRenglon(row: OrigenCorreoRenglon): number {
  if (typeof row.Cantidad === "number") return row.Cantidad;
  return parseDecimalEs(String(row.Cantidad ?? "")) ?? 0;
}

/** Puntaje de que la línea guardada salió de este renglón (0 = nada en común). */
function puntaje(
  linea: LineaParaEmparejar,
  row: OrigenCorreoRenglon,
  cercania: number,
): number {
  const idLinea = linea.idProducto.trim();
  if (idLinea && norm(row._idProducto) === norm(idLinea)) return 10;
  const afinidad = afinidadDeNombres(row.Producto, linea.nombre);
  if (afinidad < 0) return 0;
  let puntos = afinidad * 2;
  const codigoRenglon = norm(row["Codigo producto"]);
  if (codigoRenglon && codigoRenglon === norm(linea.codigo)) puntos += 3;
  if (puntos <= 0) return 0;
  const cantidadLinea = parseDecimalEs(linea.cantidadInput) ?? 0;
  if (Math.abs(cantidadLinea - cantidadRenglon(row)) < 0.001) puntos += 0.5;
  return puntos - 0.01 * cercania;
}

/**
 * REQ-309: índices de los renglones de una OT que todavía no tienen su línea en BD.
 * Empareja por identidad (producto verificado, código, nombre sin contradicción de color y
 * cantidad), de mejor a peor, y solo lo que queda sin pareja se empareja por posición. Así,
 * si materializar descartó un renglón, el pendiente es ese y no el último de la lista.
 */
export function indicesRenglonesSinLinea(
  lineas: readonly LineaParaEmparejar[],
  renglones: readonly OrigenCorreoRenglon[],
): number[] {
  const candidatos: Array<{ i: number; j: number; s: number }> = [];
  lineas.forEach((linea, i) =>
    renglones.forEach((row, j) => {
      const s = puntaje(linea, row, Math.abs(i - j));
      if (s > 0) candidatos.push({ i, j, s });
    }),
  );
  candidatos.sort((x, y) => y.s - x.s || x.j - y.j);
  const lineaUsada = new Set<number>();
  const renglonUsado = new Set<number>();
  for (const c of candidatos) {
    if (lineaUsada.has(c.i) || renglonUsado.has(c.j)) continue;
    lineaUsada.add(c.i);
    renglonUsado.add(c.j);
  }
  const lineasLibres = lineas.map((_, i) => i).filter((i) => !lineaUsada.has(i));
  const renglonesLibres = renglones.map((_, j) => j).filter((j) => !renglonUsado.has(j));
  // Sin identidad que las una, las que sobran se emparejan en el orden del documento.
  renglonesLibres.slice(0, lineasLibres.length).forEach((j) => renglonUsado.add(j));
  return renglones.map((_, j) => j).filter((j) => !renglonUsado.has(j));
}
