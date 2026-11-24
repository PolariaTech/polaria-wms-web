import {
  groupOrigenCorreoToOrdenesTrabajo,
  parseOrigenCorreoJson,
} from "../utils/origen/origen-correo-ordenes-trabajo";
import { filterLineasByOrdenTrabajoHija } from "../utils/ot/filter-lineas-by-orden-trabajo";
import type { OrdenTareaAlmacenPrintData } from "./orden-tarea-almacen.types";
import type {
  OrdenVentaDetalleRow,
  OrdenVentaOperadorRow,
} from "../../shared/types/sales.types";
import {
  buildBaseSheet,
  paginarHojaPorProductos,
  PRODUCTOS_POR_HOJA_TAREA,
} from "./map-orden-tarea-almacen.sheet";

export { PRODUCTOS_POR_HOJA_TAREA };
export {
  diaSemanaEntregaEs,
  formatOrdenTareaImpresaAt,
  formatOrdenTareaMetaLabel,
  formatOrdenTareaPageMeta,
  resolveOrdenTareaCreadaAt,
  stampOrdenTareaImpresaNow,
} from "./map-orden-tarea-almacen.format";

/** Una sola hoja (compat): OV completa sin pajinar por OT. */
export function mapOrdenVentaToAlmacenPrintData(input: {
  listRow: OrdenVentaOperadorRow;
  detalle: OrdenVentaDetalleRow | null;
  printedAt?: Date;
  timeZone?: string;
}): OrdenTareaAlmacenPrintData {
  const sheets = mapOrdenVentaToAlmacenPrintSheets(input);
  return sheets[0]!;
}

/**
 * Una hoja por orden de trabajo (hija de origen_correo).
 * Si no hay hijas, una sola hoja con toda la OV (1/1).
 */
export function mapOrdenVentaToAlmacenPrintSheets(input: {
  listRow: OrdenVentaOperadorRow;
  detalle: OrdenVentaDetalleRow | null;
  printedAt?: Date;
  /** IANA; default America/Cancun. */
  timeZone?: string;
}): OrdenTareaAlmacenPrintData[] {
  const printedAt = input.printedAt ?? new Date();
  const timeZone = input.timeZone?.trim() || "America/Cancun";
  const detalle = input.detalle;
  const listRow = input.listRow;
  const allLineas = detalle?.lineas ?? [];

  const hijas = groupOrigenCorreoToOrdenesTrabajo(
    parseOrigenCorreoJson(detalle?.origen_correo),
  );

  if (hijas.length === 0) {
    return paginarHojaPorProductos(
      buildBaseSheet({
        listRow,
        detalle,
        printedAt,
        hija: null,
        lineas: allLineas,
        tareaIndex: 1,
        tareaTotal: 1,
        timeZone,
      }),
    );
  }

  const total = hijas.length;
  return hijas.flatMap((hija, index) =>
    paginarHojaPorProductos(
      buildBaseSheet({
        listRow,
        detalle,
        printedAt,
        hija,
        lineas: filterLineasByOrdenTrabajoHija(allLineas, hija),
        tareaIndex: index + 1,
        tareaTotal: total,
        timeZone,
      }),
    ),
  );
}