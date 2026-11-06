import type {
  EstadoOrdenVenta,
  OrdenVentaOperadorRow,
} from "../../shared/types/sales.types";
import type { OrdenTareaAlmacenPrintData } from "../print/orden-tarea-almacen.types";

/** OT elegidas por OV: `idOrdenVenta` → índices 1-based de OT (el `tareaIndex` de la hoja). */
export type SeleccionBatch = ReadonlyMap<string, ReadonlySet<number>>;

export type TipoOvBatch = "todas" | "una_ot" | "varias_ot";

export interface FiltrosBatch {
  texto: string;
  /** Comprador exacto; vacío = todos. */
  cliente: string;
  /** `YYYY-MM-DD`; vacío = cualquier fecha de entrega. */
  fechaEntrega: string;
  tipo: TipoOvBatch;
}

export const FILTROS_BATCH_INICIALES: FiltrosBatch = {
  texto: "",
  cliente: "",
  fechaEntrega: "",
  tipo: "todas",
};

export type EstadoSeleccionOv = "ninguna" | "parcial" | "todas";

export interface ResumenOvBatch {
  row: OrdenVentaOperadorRow;
  /** Índices de OT elegidas, de menor a mayor. */
  ots: number[];
}

/**
 * El batch es para sacar a bodega lo que falta por alistar: OV confirmada o en alistamiento
 * (esta última cubre reponer una hoja perdida). Una OV ya alistada, revisada, facturada o
 * despachada no se vuelve a imprimir desde aquí.
 */
export function puedeImprimirEnBatch(estado: EstadoOrdenVenta): boolean {
  return estado === "confirmada" || estado === "alistamiento";
}

/** Una OV sin OT registradas se imprime como una sola hoja (1/1). */
export function totalOtDeOv(row: OrdenVentaOperadorRow): number {
  return Math.max(1, Math.trunc(row.ordenesTrabajo) || 1);
}

/** Día de entrega `YYYY-MM-DD`; vacío si la OV no tiene fecha. */
export function diaEntregaDeOv(row: OrdenVentaOperadorRow): string {
  const dia = row.fechaEntrega?.trim().slice(0, 10) ?? "";
  return /^\d{4}-\d{2}-\d{2}$/.test(dia) ? dia : "";
}

/**
 * Misma regla que el PDF: la OV que entrega primero va primero. Las OV sin fecha van al final
 * y, a igual día, se conserva el orden recibido. (La hora de entrega solo se conoce al leer
 * el detalle de la OV, así que el orden fino por hora lo aplica el PDF.)
 */
export function ordenarOvPorEntrega(
  rows: readonly OrdenVentaOperadorRow[],
): OrdenVentaOperadorRow[] {
  return rows
    .map((row, indice) => ({ row, indice, dia: diaEntregaDeOv(row) }))
    .sort((a, b) => {
      if (a.dia !== b.dia) {
        if (!a.dia) return 1;
        if (!b.dia) return -1;
        return a.dia < b.dia ? -1 : 1;
      }
      return a.indice - b.indice;
    })
    .map((item) => item.row);
}

/** «Jueves 5 de noviembre» para el encabezado de cada día; vacío = «Sin fecha de entrega». */
export function etiquetaDiaEntrega(dia: string): string {
  if (!dia) return "Sin fecha de entrega";
  const [anio, mes, diaMes] = dia.split("-").map(Number);
  const texto = new Date(Date.UTC(anio!, mes! - 1, diaMes!)).toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function filtrarOvBatch(
  rows: readonly OrdenVentaOperadorRow[],
  filtros: FiltrosBatch,
): OrdenVentaOperadorRow[] {
  const texto = filtros.texto.trim().toLowerCase();
  return rows.filter((row) => {
    if (filtros.cliente && row.comprador !== filtros.cliente) return false;
    if (filtros.fechaEntrega && diaEntregaDeOv(row) !== filtros.fechaEntrega) {
      return false;
    }
    const total = totalOtDeOv(row);
    if (filtros.tipo === "una_ot" && total !== 1) return false;
    if (filtros.tipo === "varias_ot" && total <= 1) return false;
    if (!texto) return true;
    const haystack = [row.venta, row.comprador, row.occ, ...row.occTodas]
      .join(" ")
      .toLowerCase();
    return haystack.includes(texto);
  });
}

export function clientesDeOv(
  rows: readonly OrdenVentaOperadorRow[],
): string[] {
  const nombres = new Set<string>();
  for (const row of rows) {
    const nombre = row.comprador.trim();
    if (nombre && nombre !== "—") nombres.add(nombre);
  }
  return [...nombres].sort((a, b) => a.localeCompare(b, "es"));
}

function conOv(
  seleccion: SeleccionBatch,
  idOrdenVenta: string,
  ots: ReadonlySet<number>,
): SeleccionBatch {
  const siguiente = new Map(seleccion);
  if (ots.size === 0) siguiente.delete(idOrdenVenta);
  else siguiente.set(idOrdenVenta, ots);
  return siguiente;
}

function todasLasOt(row: OrdenVentaOperadorRow): Set<number> {
  return new Set(Array.from({ length: totalOtDeOv(row) }, (_, i) => i + 1));
}

export function estadoSeleccionOv(
  seleccion: SeleccionBatch,
  row: OrdenVentaOperadorRow,
): EstadoSeleccionOv {
  const elegidas = seleccion.get(row.idOrdenVenta)?.size ?? 0;
  if (elegidas === 0) return "ninguna";
  return elegidas >= totalOtDeOv(row) ? "todas" : "parcial";
}

/** Marca o desmarca una OT suelta. */
export function alternarOt(
  seleccion: SeleccionBatch,
  row: OrdenVentaOperadorRow,
  ot: number,
): SeleccionBatch {
  const ots = new Set(seleccion.get(row.idOrdenVenta) ?? []);
  if (ots.has(ot)) ots.delete(ot);
  else ots.add(ot);
  return conOv(seleccion, row.idOrdenVenta, ots);
}

/** Marca la OV completa; si ya estaba completa, la desmarca. Parcial pasa a completa. */
export function alternarOv(
  seleccion: SeleccionBatch,
  row: OrdenVentaOperadorRow,
): SeleccionBatch {
  if (estadoSeleccionOv(seleccion, row) === "todas") {
    return conOv(seleccion, row.idOrdenVenta, new Set());
  }
  return conOv(seleccion, row.idOrdenVenta, todasLasOt(row));
}

/** Selección por grupo: marca todas las OT de las OV dadas (las ya elegidas se conservan). */
export function seleccionarGrupo(
  seleccion: SeleccionBatch,
  rows: readonly OrdenVentaOperadorRow[],
): SeleccionBatch {
  const siguiente = new Map(seleccion);
  for (const row of rows) siguiente.set(row.idOrdenVenta, todasLasOt(row));
  return siguiente;
}

/** Desmarca todo lo elegido de las OV dadas. */
export function quitarGrupo(
  seleccion: SeleccionBatch,
  rows: readonly OrdenVentaOperadorRow[],
): SeleccionBatch {
  const siguiente = new Map(seleccion);
  for (const row of rows) siguiente.delete(row.idOrdenVenta);
  return siguiente;
}

/**
 * Lo elegido, en el orden de la lista. Ignora OV que ya no están (por ejemplo canceladas
 * tras recargar) y OT que ya no existen en la OV.
 */
export function resumenSeleccion(
  seleccion: SeleccionBatch,
  rows: readonly OrdenVentaOperadorRow[],
): ResumenOvBatch[] {
  const resumen: ResumenOvBatch[] = [];
  for (const row of rows) {
    const elegidas = seleccion.get(row.idOrdenVenta);
    if (!elegidas || elegidas.size === 0) continue;
    const total = totalOtDeOv(row);
    const ots = [...elegidas].filter((ot) => ot >= 1 && ot <= total);
    if (ots.length > 0) resumen.push({ row, ots: ots.sort((a, b) => a - b) });
  }
  return resumen;
}

export function contarSeleccion(resumen: readonly ResumenOvBatch[]): {
  ov: number;
  ot: number;
} {
  return {
    ov: resumen.length,
    ot: resumen.reduce((suma, item) => suma + item.ots.length, 0),
  };
}

/** Deja solo las hojas de las OT elegidas (una OT con muchos renglones ocupa varias hojas). */
export function filtrarHojasElegidas(
  hojas: readonly OrdenTareaAlmacenPrintData[],
  ots: readonly number[],
): OrdenTareaAlmacenPrintData[] {
  const elegidas = new Set(ots);
  return hojas.filter((hoja) => elegidas.has(hoja.tareaIndex ?? 1));
}
