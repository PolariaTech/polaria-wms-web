import { parseIdOrdenTrabajoFields } from "../../utils/origen/origen-correo-ordenes-trabajo";

export function resolveOtFotoDisplay(ot: {
  idOrdenTrabajo: string;
  label?: string;
  numeroPedido?: string;
  centroConsumo?: string;
}) {
  const parsed = parseIdOrdenTrabajoFields(ot.idOrdenTrabajo);
  return {
    label: ot.label?.trim() || parsed.label,
    numeroPedido: ot.numeroPedido?.trim() || parsed.numeroPedido,
    centroConsumo: ot.centroConsumo?.trim() || parsed.centroConsumo,
  };
}