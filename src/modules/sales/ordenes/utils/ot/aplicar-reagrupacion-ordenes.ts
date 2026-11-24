import type { OrdenTrabajoHija } from "../origen/origen-correo-ordenes-trabajo";
import { validarPropuestaContraBase } from "./validar-propuesta-reagrupacion";
import {
  ETIQUETA_OT_NUEVA_POR_DEFECTO,
  generarIdOtManual,
  mismoValorOVacio,
  parseCantidadRenglon,
  sanitizarEtiqueta,
  texto,
} from "./reagrupar-ordenes-trabajo.helpers";
import type {
  IndiceReagrupacion,
  LineaReagrupable,
  PropuestaReagrupacionApi,
  ResultadoReagrupacion,
} from "./reagrupar-ordenes-trabajo.types";

export function aplicarReagrupacion<TLinea extends LineaReagrupable>(params: {
  hijas: readonly OrdenTrabajoHija[];
  lineas: readonly TLinea[];
  propuesta: Pick<PropuestaReagrupacionApi, "ots">;
  indice: IndiceReagrupacion;
  generarIdOt?: () => string;
}): ResultadoReagrupacion<TLinea> {
  const { hijas, lineas, propuesta, indice } = params;
  const generarIdOt = params.generarIdOt ?? generarIdOtManual;
  validarPropuestaContraBase(propuesta, hijas, indice);

  const hijaPorId = new Map(hijas.map((hija) => [hija.id, hija]));
  const posicionRenglon = new Map(indice.orden.map((id, posicion) => [id, posicion]));
  const lineasNuevas = lineas.map((linea) => ({ ...linea }));
  const movimientos: ResultadoReagrupacion<TLinea>["movimientos"] = [];
  const otNuevas: Array<{ id: string; label: string }> = [];

  const nuevasHijas: OrdenTrabajoHija[] = [];
  for (const ot of propuesta.ots) {
    if (ot.renglonIds.length === 0) continue;

    const renglonIds = [...ot.renglonIds].sort(
      (a, b) => posicionRenglon.get(a)! - posicionRenglon.get(b)!,
    );
    const indexados = renglonIds.map((id) => indice.porRenglonId.get(id)!);
    const renglones = indexados.map((item) => item.renglon);
    const totalCantidad = renglones.reduce(
      (suma, renglon) => suma + parseCantidadRenglon(renglon.Cantidad),
      0,
    );

    let base: OrdenTrabajoHija;
    if (ot.otId !== null) {
      base = { ...hijaPorId.get(ot.otId)!, renglones, totalCantidad };
    } else {
      const origenes = indexados.map(
        (item) => hijaPorId.get(item.otIdOrigen)!,
      );
      const almacen = mismoValorOVacio(origenes.map((origen) => origen.almacen));
      const numeroPedido = mismoValorOVacio(origenes.map((origen) => origen.numeroPedido));
      const etiqueta =
        sanitizarEtiqueta(ot.etiquetaSugerida) || ETIQUETA_OT_NUEVA_POR_DEFECTO;
      base = {
        id: generarIdOt(),
        label: etiqueta,
        numeroPedido,
        almacen,
        referenciaPedido: mismoValorOVacio(origenes.map((origen) => origen.referenciaPedido)),
        fecha: mismoValorOVacio(origenes.map((origen) => origen.fecha)),
        responsableExterno: mismoValorOVacio(
          origenes.map((origen) => origen.responsableExterno),
        ),
        renglones,
        totalCantidad,
      };
    }
    nuevasHijas.push(base);
    if (ot.otId === null) otNuevas.push({ id: base.id, label: base.label });

    for (const item of indexados) {
      if (item.otIdOrigen !== base.id) {
        movimientos.push({
          producto: texto(item.renglon.Producto),
          cantidad: parseCantidadRenglon(item.renglon.Cantidad),
          desde: hijaPorId.get(item.otIdOrigen)!.label,
          hacia: base.label,
        });
      }
      if (item.lineaIndex === null) continue;
      lineasNuevas[item.lineaIndex]!.otId = base.id;
    }
  }

  return {
    hijas: nuevasHijas,
    lineas: lineasNuevas,
    movimientos,
    otNuevas,
  };
}