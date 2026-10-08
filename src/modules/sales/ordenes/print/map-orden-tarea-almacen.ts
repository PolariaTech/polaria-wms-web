import { formatKgEs } from "@/lib/utils/decimal-es";
import type {
  OrdenVentaDetalleRow,
  OrdenVentaLineaRow,
  OrdenVentaOperadorRow,
} from "../../shared/types/sales.types";
import {
  formatCompradorNombreOrdenVenta,
  resolveOrdenVentaLineaTitulo,
} from "../utils/orden-venta-display";
import {
  formatCapturaFecha,
  notaCapturaForLinea,
  parseOrdenVentaCapturaObservaciones,
  stripSurtidoFotoQrFromNotas,
} from "../utils/build-orden-venta-captura-observaciones";
import { filterLineasByOrdenTrabajoHija } from "../utils/filter-lineas-by-orden-trabajo";
import {
  groupOrigenCorreoToOrdenesTrabajo,
  parseOrigenCorreoJson,
  type OrdenTrabajoHija,
} from "../utils/origen-correo-ordenes-trabajo";
import {
  extractNotasClaveCorreo,
  fitNotasGeneralesPdf,
  looksLikeEmailHeaderJunk,
  sanitizeNotasGeneralesPedido,
} from "../utils/texto-origen-pedido";
import type { OrdenTareaAlmacenPrintData } from "./orden-tarea-almacen.types";

export const PRODUCTOS_POR_HOJA_TAREA = 49;

/** Formato meta del PDF: dd/mm/aaaa HH:mm (hora local). */
export function formatOrdenTareaImpresaAt(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Fecha/hora de creación de la OV (`created_at`).
 * No usa la hora de impresión como fallback (evitar Creada ≈ Impresa).
 */
export function resolveOrdenTareaCreadaAt(input: {
  createdAt?: string | null;
  fechaPedido?: string | null;
}): Date | null {
  for (const raw of [input.createdAt, input.fechaPedido]) {
    if (!raw?.trim()) continue;
    const date = new Date(raw);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return null;
}

/** Marca «Impresa» con el instante actual (al generar/imprimir el PDF). */
export function stampOrdenTareaImpresaNow(
  sheets: readonly OrdenTareaAlmacenPrintData[],
  at: Date = new Date(),
): OrdenTareaAlmacenPrintData[] {
  const impresa = formatOrdenTareaImpresaAt(at);
  return sheets.map((sheet) => ({ ...sheet, impresa }));
}

/** Texto meta del PDF: creación + impresión. */
export function formatOrdenTareaPageMeta(input: {
  creada: string;
  impresa: string;
}): string {
  const creada = input.creada.trim();
  const impresa = input.impresa.trim();
  if (creada && impresa) return `Creada ${creada}  ·  Impresa ${impresa}`;
  if (creada) return `Creada ${creada}`;
  if (impresa) return `Impresa ${impresa}`;
  return "";
}

function formatFechaEntrega(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());
  return `${day}/${month}/${year}`;
}

function formatOrdenTrabajoCorto(
  index: number,
  total: number,
  hojaOt = 1,
  hojasOt = 1,
): string {
  const i = index > 0 ? index : 1;
  const t = total > 0 ? total : 1;
  if (hojasOt <= 1) return `${i}/${t}`;
  return `${hojaOt}-${i}/${t}`;
}

function paginarHojaPorProductos(
  sheet: OrdenTareaAlmacenPrintData,
): OrdenTareaAlmacenPrintData[] {
  const lineas = sheet.lineas ?? [];
  const tareaIndex = sheet.tareaIndex && sheet.tareaIndex > 0 ? sheet.tareaIndex : 1;
  const tareaTotal = sheet.tareaTotal && sheet.tareaTotal > 0 ? sheet.tareaTotal : 1;
  const hojasOt = Math.max(1, Math.ceil(lineas.length / PRODUCTOS_POR_HOJA_TAREA));
  if (hojasOt <= 1) {
    return [
      {
        ...sheet,
        lineaInicio: 1,
        ordenTrabajo: formatOrdenTrabajoCorto(tareaIndex, tareaTotal),
      },
    ];
  }
  const pages: OrdenTareaAlmacenPrintData[] = [];
  for (let hoja = 0; hoja < hojasOt; hoja += 1) {
    const start = hoja * PRODUCTOS_POR_HOJA_TAREA;
    pages.push({
      ...sheet,
      lineas: lineas.slice(start, start + PRODUCTOS_POR_HOJA_TAREA),
      lineaInicio: start + 1,
      ordenTrabajo: formatOrdenTrabajoCorto(
        tareaIndex,
        tareaTotal,
        hoja + 1,
        hojasOt,
      ),
    });
  }
  return pages;
}

function resolveNotasGenerales(input: {
  origenTexto: string;
  notasAlmacen: string;
}): string {
  // PDF: preferir especificaciones del correo; si no hay, notas de captura.
  const deCorreo = fitNotasGeneralesPdf(
    extractNotasClaveCorreo(input.origenTexto),
  );
  if (deCorreo && !looksLikeEmailHeaderJunk(deCorreo)) return deCorreo;
  return sanitizeNotasGeneralesPedido(
    stripSurtidoFotoQrFromNotas(input.notasAlmacen),
  );
}
function formatHoraEntrega(input: {
  ventanaDesde?: string | null;
  ventanaHasta?: string | null;
  ventanaEntrega?: string | null;
}): string {
  const desde = input.ventanaDesde?.trim() ?? "";
  const hasta = input.ventanaHasta?.trim() ?? "";
  if (desde || hasta) {
    if (desde && hasta) return `${desde} – ${hasta}`;
    return desde || hasta;
  }
  return input.ventanaEntrega?.trim() ?? "";
}

function mapLineasPrint(
  lineas: readonly OrdenVentaLineaRow[],
  notasLineas: string,
  hija?: OrdenTrabajoHija | null,
): OrdenTareaAlmacenPrintData["lineas"] {
  return lineas.map((linea) => {
    const producto = resolveOrdenVentaLineaTitulo(linea);
    const nota = notaCapturaForLinea(notasLineas, {
      nombre: producto,
      cantidad: linea.cantidad_pedida,
      otId: hija?.id,
      allowUnscoped: !hija,
    });
    return {
      producto,
      especificacion: nota,
      cantidadSolicitada: `${formatKgEs(linea.cantidad_pedida)} kg`,
    };
  });
}

function buildBaseSheet(input: {
  listRow: OrdenVentaOperadorRow;
  detalle: OrdenVentaDetalleRow | null;
  printedAt: Date;
  hija?: OrdenTrabajoHija | null;
  lineas: OrdenVentaLineaRow[];
  tareaIndex: number;
  tareaTotal: number;
}): OrdenTareaAlmacenPrintData {
  const { listRow, detalle, printedAt, hija, lineas, tareaIndex, tareaTotal } =
    input;

  if (!detalle) {
    return {
      idOrdenVenta: listRow.idOrdenVenta,
      idOrdenTrabajo: hija?.id ?? "",
      tareaIndex,
      tareaTotal,
      folio: listRow.venta,
      creada: (() => {
        const created = resolveOrdenTareaCreadaAt({
          createdAt: listRow.fecha,
        });
        return created ? formatOrdenTareaImpresaAt(created) : "";
      })(),
      impresa: formatOrdenTareaImpresaAt(printedAt),
      cliente: listRow.comprador,
      centroConsumo: hija?.almacen ?? "",
      numeroOrdenCliente: hija?.numeroPedido || listRow.venta,
      ordenTrabajo: formatOrdenTrabajoCorto(tareaIndex, tareaTotal),
      fechaEntrega: hija?.fecha
        ? formatCapturaFecha(hija.fecha)
        : formatFechaEntrega(listRow.fecha),
      horaEntrega: "",
      direccionEntrega:
        listRow.destino.trim() === "—" ? "" : listRow.destino,
      notasGenerales: "",
      lineas: [],
    };
  }

  const captura = parseOrdenVentaCapturaObservaciones(detalle.observaciones);
  const direccionCaptura = captura.direccion.trim();
  const fechaEntregaCaptura = captura.fechaEntrega.trim();

  return {
    idOrdenVenta: detalle.id_orden_venta,
    idOrdenTrabajo: hija?.id ?? "",
    tareaIndex,
    tareaTotal,
    folio: detalle.codigo,
    creada: (() => {
      const created = resolveOrdenTareaCreadaAt({
        createdAt: detalle.created_at,
        fechaPedido: detalle.fecha_pedido,
      });
      return created ? formatOrdenTareaImpresaAt(created) : "";
    })(),
    impresa: formatOrdenTareaImpresaAt(printedAt),
    cliente: formatCompradorNombreOrdenVenta(detalle),
    centroConsumo:
      hija?.almacen ||
      captura.centroConsumo ||
      detalle.centro_consumo?.trim() ||
      "",
    numeroOrdenCliente:
      hija?.numeroPedido ||
      captura.ordenCompraHotel.trim() ||
      detalle.codigo,
    ordenTrabajo: formatOrdenTrabajoCorto(tareaIndex, tareaTotal),
    fechaEntrega: hija?.fecha
      ? formatCapturaFecha(hija.fecha)
      : fechaEntregaCaptura
        ? formatCapturaFecha(fechaEntregaCaptura)
        : formatFechaEntrega(
            detalle.fecha_entrega || detalle.fecha_pedido || detalle.created_at,
          ),
    horaEntrega: formatHoraEntrega({
      ventanaDesde: detalle.ventana_desde,
      ventanaHasta: detalle.ventana_hasta,
      ventanaEntrega: captura.ventanaEntrega,
    }),
    direccionEntrega:
      direccionCaptura ||
      detalle.direccion_entrega?.trim() ||
      detalle.bodega_destino_nombre?.trim() ||
      detalle.bodega_nombre?.trim() ||
      "",
    notasGenerales: resolveNotasGenerales({
      origenTexto:
        detalle.origen_texto?.trim() || captura.origenTexto.trim() || "",
      notasAlmacen: detalle.notas_almacen?.trim() || "",
    }),
    lineas: mapLineasPrint(
      lineas,
      detalle.notas_lineas?.trim() || captura.notasLineas,
      hija,
    ),
  };
}

/** Una sola hoja (compat): OV completa sin pajinar por OT. */
export function mapOrdenVentaToAlmacenPrintData(input: {
  listRow: OrdenVentaOperadorRow;
  detalle: OrdenVentaDetalleRow | null;
  printedAt?: Date;
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
}): OrdenTareaAlmacenPrintData[] {
  const printedAt = input.printedAt ?? new Date();
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
      }),
    ),
  );
}

export function formatOrdenTareaMetaLabel(data: {
  tareaIndex?: number;
  tareaTotal?: number;
}): string {
  const index = data.tareaIndex && data.tareaIndex > 0 ? data.tareaIndex : 1;
  const total = data.tareaTotal && data.tareaTotal > 0 ? data.tareaTotal : 1;
  return `Orden de tarea ${index}/${total}`;
}
