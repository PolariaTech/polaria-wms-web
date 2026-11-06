export interface EntradaCortes {
  /** Alto total del lienzo, en píxeles. */
  alto: number;
  /** Alto útil de cada hoja, en píxeles del lienzo. */
  altoPagina: number;
  /**
   * Cuánta tinta tiene cada fila del lienzo, de 0 (en blanco) a 1 (raya de lado a lado), sin contar
   * los bordes verticales del marco. Se mide sobre la imagen ya dibujada y no sobre el HTML porque
   * `html2canvas` no dibuja los renglones exactamente donde los coloca el navegador.
   */
  tinta: readonly number[];
  /** Lo mínimo que debe llenarse una hoja (0 a 1) antes de aceptar un corte antes del límite. */
  llenadoMinimo?: number;
  /** Tope de hojas: al llegar a él ya no se buscan cortes limpios. */
  maxPaginas: number;
}

/** Una fila con menos tinta que esto cuenta como en blanco (ruido de la compresión). */
const TINTA_EN_BLANCO = 0.003;
/** Una fila con más tinta que esto es una raya de tabla. */
const TINTA_DE_RAYA = 0.8;
/** Una franja en blanco más angosta que esto es el hueco entre dos renglones, no un lugar de corte. */
const FRANJA_MINIMA = 6;
/** Cuánto aire se deja bajo una raya antes de cortar, para que la hoja cierre con ella sin tocarla. */
const AIRE_BAJO_RAYA = 3;

interface Franja {
  inicio: number;
  fin: number;
  /** Justo encima hay una raya de tabla: es el mejor lugar para cerrar una hoja. */
  bajoRaya: boolean;
}

function franjasEnBlanco(tinta: readonly number[], desde: number, hasta: number): Franja[] {
  const franjas: Franja[] = [];
  let inicio = -1;
  for (let y = Math.max(0, Math.floor(desde)); y <= hasta; y += 1) {
    // Una fila sin medir se da por dibujada: sin datos no se inventan huecos.
    const enBlanco = (tinta[y] ?? 1) <= TINTA_EN_BLANCO;
    if (enBlanco && inicio < 0) inicio = y;
    if ((!enBlanco || y === hasta) && inicio >= 0) {
      const fin = enBlanco ? y : y - 1;
      if (fin - inicio + 1 >= FRANJA_MINIMA) {
        franjas.push({ inicio, fin, bajoRaya: inicio > 0 && (tinta[inicio - 1] ?? 0) >= TINTA_DE_RAYA });
      }
      inicio = -1;
    }
  }
  return franjas;
}

/**
 * Dónde partir un documento largo en hojas sin cortar un renglón. Corta en la franja en blanco más
 * baja que cabe en la hoja y, si hay una raya encima, pegado a ella. Devuelve las posiciones de
 * corte, de menor a mayor, sin el 0 ni el final. Si en el tramo útil no hay ninguna franja (un
 * bloque más alto que la hoja) corta duro en el límite: mejor una hoja partida que una OC que no
 * se imprime.
 */
export function calcularCortes({
  alto,
  altoPagina,
  tinta,
  llenadoMinimo = 0.5,
  maxPaginas,
}: EntradaCortes): number[] {
  const cortes: number[] = [];
  let inicio = 0;
  while (alto - inicio > altoPagina && cortes.length < maxPaginas - 1) {
    const limite = Math.floor(inicio + altoPagina);
    const piso = inicio + altoPagina * llenadoMinimo;

    const franjas = franjasEnBlanco(tinta, piso, Math.min(limite, alto - 1));
    const puntoDe = (franja: Franja) =>
      franja.bajoRaya
        ? franja.inicio + Math.min(AIRE_BAJO_RAYA, Math.floor((franja.fin - franja.inicio) / 2))
        : Math.floor((franja.inicio + franja.fin) / 2);
    const valido = (punto: number) => punto > piso && punto <= limite;
    // Primero las franjas bajo una raya (entre filas de tabla: un encabezado viaja con sus filas);
    // si no hay ninguna, el hueco en blanco más bajo. Siempre de abajo hacia arriba.
    const candidatas = [...franjas].reverse();
    const elegida =
      candidatas.find((franja) => franja.bajoRaya && valido(puntoDe(franja))) ??
      candidatas.find((franja) => valido(puntoDe(franja)));
    const corte = elegida ? puntoDe(elegida) : limite;

    cortes.push(corte);
    inicio = corte;
  }
  return cortes;
}
