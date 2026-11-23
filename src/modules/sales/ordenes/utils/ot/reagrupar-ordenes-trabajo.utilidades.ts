import type { OrdenTrabajoHija } from "../origen/origen-correo-ordenes-trabajo";
import {
  ETIQUETA_OT_NUEVA_POR_DEFECTO,
  parseCantidadRenglon,
  sanitizarEtiqueta,
  texto,
} from "./reagrupar-ordenes-trabajo.helpers";
import type {
  EstadoBaseApi,
  LineaReagrupable,
  MovimientoAplicado,
  MovimientoVista,
  PropuestaReagrupacionApi,
  ResumenReagrupacion,
} from "./reagrupar-ordenes-trabajo.types";

export function crearSnapshotReagrupacion<TLinea extends LineaReagrupable>(
  hijas: readonly OrdenTrabajoHija[],
  lineas: readonly TLinea[],
): { hijas: OrdenTrabajoHija[]; lineas: TLinea[] } {
  return {
    hijas: structuredClone(hijas) as OrdenTrabajoHija[],
    lineas: structuredClone(lineas) as TLinea[],
  };
}

export function puedeReagruparOt(
  estadoOrdenVenta: string | null | undefined,
  cantidadOts: number,
): boolean {
  return (
    (estadoOrdenVenta ?? "").trim().toLowerCase() === "por_confirmar" &&
    cantidadOts >= 1
  );
}

export function firmaEstadoReagrupacion(
  hijas: readonly OrdenTrabajoHija[],
  lineas: readonly LineaReagrupable[],
): string {
  return JSON.stringify([
    hijas.map((hija) => [
      hija.id,
      hija.renglones.map((renglon) => [
        texto(renglon.Producto),
        parseCantidadRenglon(renglon.Cantidad),
      ]),
    ]),
    lineas.map((linea) => [linea.otId ?? "", linea.nombre, linea.cantidadInput]),
  ]);
}

const MAX_INSTRUCCION_BITACORA = 500;

export function describirReagrupacionParaBitacora(params: {
  autor: string;
  instruccion: string;
  resumen: ResumenReagrupacion;
  movimientos: readonly MovimientoAplicado[];
  otNuevas: ReadonlyArray<{ id: string; label: string }>;
}): { mensaje: string; payloadExtra: Record<string, unknown> } {
  const { resumen } = params;
  const nuevas =
    params.otNuevas.length > 0
      ? ` (${params.otNuevas.length} ${params.otNuevas.length === 1 ? "nueva" : "nuevas"})`
      : "";
  return {
    mensaje: `Órdenes de trabajo reagrupadas con IA por ${params.autor}: ${resumen.antes} → ${resumen.despues}${nuevas}.`,
    payloadExtra: {
      reagrupacionIa: {
        instruccion: Array.from(params.instruccion.trim())
          .slice(0, MAX_INSTRUCCION_BITACORA)
          .join(""),
        resumen,
        movimientos: params.movimientos,
        otNuevas: params.otNuevas,
      },
    },
  };
}

export function describirMovimientosPropuesta(
  propuesta: Pick<PropuestaReagrupacionApi, "ots" | "movimientos">,
  estadoBase: EstadoBaseApi,
): MovimientoVista[] {
  const etiquetaPorOt = new Map<string, string>(
    estadoBase.ots.map((ot) => [ot.otId, ot.etiqueta]),
  );
  for (const ot of propuesta.ots) {
    if (ot.nuevaClave !== null) {
      etiquetaPorOt.set(
        ot.nuevaClave,
        sanitizarEtiqueta(ot.etiquetaSugerida) || ETIQUETA_OT_NUEVA_POR_DEFECTO,
      );
    }
  }
  const renglonPorId = new Map(
    estadoBase.ots.flatMap((ot) =>
      ot.renglones.map((renglon) => [renglon.renglonId, renglon] as const),
    ),
  );

  return propuesta.movimientos.flatMap((movimiento) => {
    const renglon = renglonPorId.get(movimiento.renglonId);
    if (!renglon) return [];
    return [
      {
        producto: renglon.producto,
        cantidad: renglon.cantidad,
        desde: etiquetaPorOt.get(movimiento.deOtId) ?? movimiento.deOtId,
        hacia: etiquetaPorOt.get(movimiento.aOtId) ?? movimiento.aOtId,
      },
    ];
  });
}