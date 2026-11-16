import { parseDdMmYyyyToIso } from "@/lib/utils/fecha-dd-mm-yyyy";
import type { OrdenTareaAlmacenPrintData } from "../print/orden-tarea-almacen.types";

/** Sin fecha o sin hora reconocible: la hoja va después de las que sí la tienen. */
const SIN_DATO = Number.MAX_SAFE_INTEGER;

/** Fecha impresa (`DD-MMM-AAAA` o legado `DD/MM/AAAA`) → `AAAAMMDD`. */
function claveFecha(fechaEntrega: string): number {
  const iso = parseDdMmYyyyToIso(fechaEntrega);
  if (!iso) return SIN_DATO;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return SIN_DATO;
  return Number(`${match[1]}${match[2]}${match[3]}`);
}

/**
 * Minutos del día en que empieza la entrega. La hoja trae la ventana como «06:00 – 09:00»,
 * una hora suelta o texto libre; solo cuenta la primera hora que aparezca.
 */
function claveHora(horaEntrega: string): number {
  const match = /(\d{1,2}):(\d{2})/.exec(horaEntrega);
  if (!match) return SIN_DATO;
  return Number(match[1]) * 60 + Number(match[2]);
}

/**
 * Regla fija del batch (no se puede quitar): se imprime por fecha de entrega y, dentro del
 * mismo día, por hora de entrega, para que bodega aliste primero lo que sale primero.
 * A igual fecha y hora se conserva el orden de la lista; las hojas de una misma OT no se separan.
 */
export function ordenarHojasPorEntrega(
  hojas: readonly OrdenTareaAlmacenPrintData[],
): OrdenTareaAlmacenPrintData[] {
  return hojas
    .map((hoja, indice) => ({
      hoja,
      indice,
      fecha: claveFecha(hoja.fechaEntrega),
      hora: claveHora(hoja.horaEntrega),
    }))
    .sort((a, b) => a.fecha - b.fecha || a.hora - b.hora || a.indice - b.indice)
    .map((item) => item.hoja);
}
