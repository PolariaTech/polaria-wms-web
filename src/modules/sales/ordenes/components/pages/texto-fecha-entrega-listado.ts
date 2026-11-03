import { formatCapturaFecha } from "../../utils/pedido/build-orden-venta-captura-observaciones";
import { resolveFechaEntregaDesdeOrigen } from "../../utils/origen/materialize-ov-desde-origen";
import { parseOrigenCorreoJson } from "../../utils/origen/origen-correo-ordenes-trabajo";

/**
 * Texto de la columna de entrega del listado: solo el día.
 * Confirmada: la fecha guardada en el pedido. Si no hay, la celda queda vacía.
 * Por confirmar: esa fecha si ya está, y si no la tentativa del correo.
 */
export function textoFechaEntregaListado(input: {
  estado: string;
  fechaEntrega?: string | null;
  origenCorreo?: unknown;
}): string {
  const oficial = diaSinHora(input.fechaEntrega);
  if (input.estado !== "por_confirmar") return oficial;
  if (oficial) return oficial;
  const tentativa = resolveFechaEntregaDesdeOrigen({
    origenCorreo: parseOrigenCorreoJson(input.origenCorreo),
  });
  return tentativa ? formatCapturaFecha(tentativa) : "";
}

function diaSinHora(value: string | null | undefined): string {
  const raw = value?.trim() ?? "";
  if (!raw) return "";
  return formatCapturaFecha(raw);
}
