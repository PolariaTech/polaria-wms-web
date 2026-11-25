import type { OrdenTrabajoHija } from "../origen/origen-correo-ordenes-trabajo";
import {
  aEscala,
  PATRON_OT_NUEVA,
  parseCantidadRenglon,
} from "./reagrupar-ordenes-trabajo.helpers";
import type {
  IndiceReagrupacion,
  MotivoPropuestaInvalida,
  PropuestaReagrupacionApi,
} from "./reagrupar-ordenes-trabajo.types";

export class PropuestaInvalidaError extends Error {
  constructor(readonly motivo: MotivoPropuestaInvalida) {
    super(`La propuesta no respeta las órdenes de trabajo originales (${motivo}).`);
    this.name = "PropuestaInvalidaError";
  }
}

export function validarPropuestaContraBase(
  propuesta: Pick<PropuestaReagrupacionApi, "ots">,
  hijas: readonly OrdenTrabajoHija[],
  indice: IndiceReagrupacion,
): void {
  const idsHijas = new Set(hijas.map((hija) => hija.id));
  const otsVistas = new Set<string>();
  const renglonesVistos = new Set<string>();

  for (const ot of propuesta.ots) {
    const clave = ot.otId ?? ot.nuevaClave;
    const esExistente = ot.otId !== null && idsHijas.has(ot.otId);
    const esNueva =
      ot.otId === null &&
      ot.nuevaClave !== null &&
      PATRON_OT_NUEVA.test(ot.nuevaClave);
    if (!esExistente && !esNueva) throw new PropuestaInvalidaError("OT_INEXISTENTE");
    if (clave === null || otsVistas.has(clave)) {
      throw new PropuestaInvalidaError("OT_DUPLICADA");
    }
    otsVistas.add(clave);

    for (const renglonId of ot.renglonIds) {
      if (!indice.porRenglonId.has(renglonId) || renglonesVistos.has(renglonId)) {
        throw new PropuestaInvalidaError("RENGLONES_NO_COINCIDEN");
      }
      renglonesVistos.add(renglonId);
    }
  }

  if (renglonesVistos.size !== indice.porRenglonId.size) {
    throw new PropuestaInvalidaError("RENGLONES_NO_COINCIDEN");
  }

  let totalBase = 0;
  for (const { renglon } of indice.porRenglonId.values()) {
    totalBase += aEscala(parseCantidadRenglon(renglon.Cantidad));
  }
  let totalFinal = 0;
  for (const ot of propuesta.ots) {
    for (const renglonId of ot.renglonIds) {
      totalFinal += aEscala(
        parseCantidadRenglon(indice.porRenglonId.get(renglonId)!.renglon.Cantidad),
      );
    }
  }
  if (totalBase !== totalFinal) throw new PropuestaInvalidaError("TOTALES_NO_COINCIDEN");
}