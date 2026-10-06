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
  notaCapturaForProducto,
  parseOrdenVentaCapturaObservaciones,
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
} from "../utils/texto-origen-pedido";
import type { OrdenTareaAlmacenPrintData } from "./orden-tarea-almacen.types";

export const PRODUCTOS_POR_HOJA_TAREA = 49;

export function formatOrdenTareaImpresaAt(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month} ${hours}:${minutes}`;
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
  const deCorreo = extractNotasClaveCorreo(input.origenTexto);
  const deAlmacen = input.notasAlmacen.trim();
  const almacenEsSurtido = /surtido\s*\(\s*foto\s*qr\s*\)/i.test(deAlmacen);
  return fitNotasGeneralesPdf(deCorreo || (almacenEsSurtido ? "" : deAlmacen));
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
): OrdenTareaAlmacenPrintData["lineas"] {
  return lineas.map((linea) => {
    const producto = resolveOrdenVentaLineaTitulo(linea);
    const nota = notaCapturaForProducto(notasLineas, producto);
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
