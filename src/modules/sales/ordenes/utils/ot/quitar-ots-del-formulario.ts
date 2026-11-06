import type { OrdenTrabajoHija } from "../origen/origen-correo-ordenes-trabajo";
import type {
  IndiceReagrupacion,
  LineaReagrupable,
} from "./reagrupar-ordenes-trabajo";

/**
 * REQ-262 / REQ-273: al partir la orden de venta, las tareas de las órdenes de compra que
 * salen dejan de estar en el formulario de la orden actual.
 *
 * Quita esas tareas y sus líneas. Si el formulario no las quita, el siguiente guardado
 * volvería a juntar en la orden actual lo que el servidor ya movió a la nueva.
 * Las líneas se encuentran por el índice del estado base (mismo emparejamiento que usa
 * la reorganización) y, por seguridad, también por el `otId` que traen.
 */
export function quitarOtsDelFormulario<TLinea extends LineaReagrupable>(params: {
  hijas: readonly OrdenTrabajoHija[];
  lineas: readonly TLinea[];
  otIdsQueSalen: readonly string[];
  indice: IndiceReagrupacion;
}): { hijas: OrdenTrabajoHija[]; lineas: TLinea[] } {
  const salen = new Set(params.otIdsQueSalen);

  const lineasQueSalen = new Set<number>();
  for (const item of params.indice.porRenglonId.values()) {
    if (salen.has(item.otIdOrigen) && item.lineaIndex !== null) {
      lineasQueSalen.add(item.lineaIndex);
    }
  }

  return {
    hijas: params.hijas.filter((hija) => !salen.has(hija.id)),
    lineas: params.lineas.filter(
      (linea, posicion) =>
        !lineasQueSalen.has(posicion) &&
        !(linea.otId !== undefined && salen.has(linea.otId)),
    ),
  };
}
