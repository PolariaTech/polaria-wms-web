import type {
  OrdenTrabajoHija,
  OrigenCorreoRenglon,
} from "../origen/origen-correo-ordenes-trabajo";
import { scoreMatch } from "./filter-lineas-by-orden-trabajo";
import type { LineaReagrupable } from "./reagrupar-ordenes-trabajo.types";

export function emparejarLineas(
  hijas: readonly OrdenTrabajoHija[],
  lineas: readonly LineaReagrupable[],
  parseCantidad: (raw: string) => number,
): Map<string, number> {
  const envueltas = lineas.map((linea, index) => ({
    index,
    otId: linea.otId,
    cantidad_pedida: parseCantidad(linea.cantidadInput),
    matchNombre: linea.nombre,
    matchCodigo: linea.codigo,
    producto: {
      sku: linea.codigo || null,
      descripcion: linea.nombre,
      metadatos_catalogo: null,
    },
  }));

  const usadas = new Set<number>();
  const lineaPorClave = new Map<string, number>();

  const emparejar = (
    claveRenglon: string,
    renglon: OrigenCorreoRenglon,
    candidatas: typeof envueltas,
  ) => {
    let mejorIndice = -1;
    let mejorPuntaje = -1;
    for (const candidata of candidatas) {
      if (usadas.has(candidata.index)) continue;
      const puntaje = scoreMatch(candidata, renglon);
      if (puntaje > mejorPuntaje) {
        mejorPuntaje = puntaje;
        mejorIndice = candidata.index;
      }
    }
    if (mejorIndice >= 0) {
      usadas.add(mejorIndice);
      lineaPorClave.set(claveRenglon, mejorIndice);
    }
  };

  hijas.forEach((hija, indiceHija) => {
    const propias = envueltas.filter((linea) => linea.otId === hija.id);
    hija.renglones.forEach((renglon, indiceRenglon) => {
      emparejar(`${indiceHija}:${indiceRenglon}`, renglon, propias);
    });
  });

  const sinOt = envueltas.filter((linea) => !linea.otId);
  hijas.forEach((hija, indiceHija) => {
    hija.renglones.forEach((renglon, indiceRenglon) => {
      const clave = `${indiceHija}:${indiceRenglon}`;
      if (!lineaPorClave.has(clave)) emparejar(clave, renglon, sinOt);
    });
  });

  return lineaPorClave;
}