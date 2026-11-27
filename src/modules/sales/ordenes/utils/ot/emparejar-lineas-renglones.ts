import type { OrigenCorreoRenglon } from "../origen/origen-correo-ordenes-trabajo";

/** Mismo texto de producto aunque cambien mayúsculas, acentos o espacios. */
export function normalizarTextoProducto(raw: string | null | undefined): string {
  return (raw ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * REQ-425: texto del cliente con el que se creó la línea (renglón de origen).
 * Es la señal más fiable: el «Codigo producto» del cliente casi nunca es nuestro SKU.
 */
export function textoClienteDeLinea(linea: {
  matchTextoCliente?: string | null;
  match_producto?: unknown;
}): string {
  const directo = normalizarTextoProducto(linea.matchTextoCliente);
  if (directo) return directo;
  const match = linea.match_producto;
  if (!match || typeof match !== "object") return "";
  const texto = (match as { textoCliente?: unknown }).textoCliente;
  return typeof texto === "string" ? normalizarTextoProducto(texto) : "";
}

/**
 * Empareja 1:1 líneas con renglones de forma global: primero los pares con
 * mayor puntaje, así un renglón sin línea propia no roba la de otro producto
 * (LECHUGA LARGA no se queda la de LECHUGA ROMANA). Devuelve índice de línea →
 * índice de renglón; puntaje < 0 = no emparejable.
 */
export function emparejarLineasConRenglones<L>(
  lineas: readonly L[],
  renglones: readonly OrigenCorreoRenglon[],
  puntuar: (linea: L, renglon: OrigenCorreoRenglon) => number,
): Map<number, number> {
  const candidatos: Array<{ linea: number; renglon: number; puntaje: number }> = [];
  renglones.forEach((renglon, indiceRenglon) => {
    lineas.forEach((linea, indiceLinea) => {
      const puntaje = puntuar(linea, renglon);
      if (puntaje >= 0) {
        candidatos.push({ linea: indiceLinea, renglon: indiceRenglon, puntaje });
      }
    });
  });
  candidatos.sort(
    (izq, der) =>
      der.puntaje - izq.puntaje ||
      izq.renglon - der.renglon ||
      izq.linea - der.linea,
  );

  const renglonPorLinea = new Map<number, number>();
  const renglonesUsados = new Set<number>();
  for (const candidato of candidatos) {
    if (renglonPorLinea.has(candidato.linea)) continue;
    if (renglonesUsados.has(candidato.renglon)) continue;
    renglonPorLinea.set(candidato.linea, candidato.renglon);
    renglonesUsados.add(candidato.renglon);
  }
  return renglonPorLinea;
}
