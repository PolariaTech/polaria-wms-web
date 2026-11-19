import type { OrdenTrabajoHija } from "../origen/origen-correo-ordenes-trabajo";
import { parseFechaOrigen } from "../origen/materialize-ov-desde-origen";
import { toDateInputValue } from "../pedido/orden-venta-create-helpers";
import { isFechaEntregaIsoValida } from "../pedido/pedido-form-validation";

function isoDeTexto(value: string | null | undefined): string {
  const raw = (value ?? "").trim();
  if (!raw) return "";
  const asInput = toDateInputValue(raw);
  if (isFechaEntregaIsoValida(asInput)) return asInput.trim();
  const parsed = parseFechaOrigen(raw);
  return parsed && isFechaEntregaIsoValida(parsed) ? parsed.trim() : "";
}

/** Fechas ISO distintas entre OT (REQ-337: una OV = un día de entrega). */
export function diasEntregaDistintosEnHijas(
  hijas: readonly OrdenTrabajoHija[],
): string[] {
  const dias = new Set<string>();
  for (const hija of hijas) {
    const desdeHija = isoDeTexto(hija.fecha);
    if (desdeHija) {
      dias.add(desdeHija);
      continue;
    }
    const desdeRenglon = isoDeTexto(hija.renglones[0]?.Fecha);
    if (desdeRenglon) dias.add(desdeRenglon);
  }
  return [...dias].sort();
}

export const MSG_FECHAS_DISTINTAS_ENTRE_OT =
  "Esta orden tiene fechas de entrega distintas entre tareas. Divide la orden de venta por día de entrega (Mateo → Dividir → Por día de entrega) antes de confirmar.";
