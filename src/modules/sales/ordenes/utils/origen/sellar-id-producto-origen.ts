import type { OrigenCorreoRenglon } from "./origen-correo-ordenes-trabajo";
import type { LineaOrigenOtSync } from "./origen-correo-build-from-form";

function norm(value: string | undefined): string {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

/** Puntaje simple nombre/código para sellar `_idProducto` sin otId (REQ-236). */
export function scoreLineaOrigenVsRenglon(
  linea: LineaOrigenOtSync,
  row: OrigenCorreoRenglon,
): number {
  const productoRow = norm(row.Producto);
  const codigoRow = norm(row["Codigo producto"]);
  const nombreLinea = norm(linea.aliasCliente || linea.nombre);
  const codigoLinea = norm(linea.codigo === "—" ? "" : linea.codigo);

  let score = 0;
  if (codigoLinea && codigoRow && codigoLinea === codigoRow) score += 4;
  if (nombreLinea && productoRow) {
    if (nombreLinea === productoRow) score += 3;
    else if (
      nombreLinea.includes(productoRow) ||
      productoRow.includes(nombreLinea)
    ) {
      score += 2;
    }
  }
  return score;
}

/**
 * REQ-236: si la OT no trajo líneas por otId, igual sella `_idProducto`
 * emparejando líneas verificadas del form con renglones de origen.
 */
export function sellarIdProductoEnRenglonesOrigen(params: {
  renglones: readonly OrigenCorreoRenglon[];
  lineasVerificadas: readonly LineaOrigenOtSync[];
}): OrigenCorreoRenglon[] {
  const usadas = new Set<number>();
  return params.renglones.map((row) => {
    if (row._idProducto?.trim()) return { ...row };
    let mejorIndice = -1;
    let mejorScore = 0;
    for (let i = 0; i < params.lineasVerificadas.length; i += 1) {
      if (usadas.has(i)) continue;
      const linea = params.lineasVerificadas[i]!;
      if (!linea.idProducto?.trim()) continue;
      const score = scoreLineaOrigenVsRenglon(linea, row);
      if (score > mejorScore) {
        mejorScore = score;
        mejorIndice = i;
      }
    }
    if (mejorIndice < 0 || mejorScore < 2) return { ...row };
    usadas.add(mejorIndice);
    return {
      ...row,
      _idProducto: params.lineasVerificadas[mejorIndice]!.idProducto!.trim(),
    };
  });
}
