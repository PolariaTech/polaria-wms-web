import type { OrdenTrabajoHija } from "../origen/origen-correo-ordenes-trabajo";
import { emparejarLineas } from "./reagrupar-emparejar-lineas";
import { parseCantidadRenglon, texto } from "./reagrupar-ordenes-trabajo.helpers";
import type {
  EstadoBaseApi,
  IndiceReagrupacion,
  LineaReagrupable,
  RenglonIndexado,
} from "./reagrupar-ordenes-trabajo.types";

export function construirEstadoBaseApi(
  hijas: readonly OrdenTrabajoHija[],
  lineas: readonly LineaReagrupable[],
  parseCantidad: (raw: string) => number,
): { estadoBase: EstadoBaseApi; indice: IndiceReagrupacion } {
  const lineaPorClave = emparejarLineas(hijas, lineas, parseCantidad);
  const porRenglonId = new Map<string, RenglonIndexado>();
  const orden: string[] = [];

  const ots = hijas.map((hija, indiceHija) => ({
    otId: hija.id,
    etiqueta: hija.label,
    almacen: hija.almacen,
    numeroPedido: hija.numeroPedido,
    renglones: hija.renglones.map((renglon, indiceRenglon) => {
      const renglonId = `renglon-${indiceHija}-${indiceRenglon}`;
      porRenglonId.set(renglonId, {
        renglonId,
        otIdOrigen: hija.id,
        renglon,
        lineaIndex: lineaPorClave.get(`${indiceHija}:${indiceRenglon}`) ?? null,
      });
      orden.push(renglonId);
      const unidad = texto(renglon.Unidad);
      return {
        renglonId,
        producto: texto(renglon.Producto),
        cantidad: parseCantidadRenglon(renglon.Cantidad),
        ...(unidad ? { unidad } : {}),
      };
    }),
  }));

  return { estadoBase: { ots }, indice: { porRenglonId, orden } };
}