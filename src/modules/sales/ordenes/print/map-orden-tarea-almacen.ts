import { formatKgEs } from "@/lib/utils/decimal-es";
import { UNIDAD_MEDIDA_VENTA_DEFAULT } from "../../shared/types/sales.types";
import type {
  OrdenVentaDetalleRow,
  OrdenVentaLineaRow,
  OrdenVentaOperadorRow,
} from "../../shared/types/sales.types";
import {
  formatCompradorNombreOrdenVenta,
  resolveOrdenVentaLineaTitulo,
} from "../utils/display/orden-venta-display";
import {
  formatCapturaFecha,
  notaCapturaForLinea,
  parseOrdenVentaCapturaObservaciones,
} from "../utils/pedido/build-orden-venta-captura-observaciones";
import { filterLineasByOrdenTrabajoHija, resolveNumeroOrdenClientePrint } from "../utils/ot/filter-lineas-by-orden-trabajo";
import {
  groupOrigenCorreoToOrdenesTrabajo,
  parseOrigenCorreoJson,
  type OrdenTrabajoHija,
} from "../utils/origen/origen-correo-ordenes-trabajo";
import type { OrdenTareaAlmacenPrintData } from "./orden-tarea-almacen.types";
import {
  getCuentaZonaHorariaOption,
  resolveCuentaZonaHorariaId,
} from "@/modules/configurator/cuentas/constants/cuenta-zona-horaria";
import { diaSemanaEntregaEs } from "../utils/pedido/dia-semana-entrega";
import {
  resolveCentroConsumoDesdeDetalle,
  resolveFechaYDiaEntregaDesdeDetalle,
  resolveNotasGeneralesDesdeDetalle,
} from "./resolve-cabecera-print-desde-detalle";

export const PRODUCTOS_POR_HOJA_TAREA = 30; // Informe OT: 20 → 30 líneas por hoja

export { diaSemanaEntregaEs };

/**
 * Formato meta del PDF: dd/mm/aaaa HH:mm en zona de la cuenta (default Cancún).
 * No usa la zona del PC.
 */
export function formatOrdenTareaImpresaAt(
  date: Date,
  timeZone: string = "America/Cancun",
): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return `${get("day")}/${get("month")}/${get("year")} ${get("hour")}:${get("minute")}`;
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
  timeZone: string = "America/Cancun",
): OrdenTareaAlmacenPrintData[] {
  const zonaId = resolveCuentaZonaHorariaId(timeZone);
  const impresa = formatOrdenTareaImpresaAt(at, zonaId);
  const zonaImpresionLabel = getCuentaZonaHorariaOption(zonaId).shortLabel;
  return sheets.map((sheet) => ({
    ...sheet,
    impresa,
    zonaImpresionLabel: sheet.zonaImpresionLabel || zonaImpresionLabel,
  }));
}

/** Texto meta del PDF: creación + impresión. */
export function formatOrdenTareaPageMeta(input: {
  creada: string;
  impresa: string;
  /** Ej. "hora de Cancún" */
  zonaLabel?: string;
}): string {
  const creada = input.creada.trim();
  const impresa = input.impresa.trim();
  const zona = input.zonaLabel?.trim() || "";
  const zonaSuffix = zona ? ` (${zona})` : "";
  if (creada && impresa) {
    return `Creada ${creada}  ·  Impresa ${impresa}${zonaSuffix}`;
  }
  if (creada) return `Creada ${creada}${zonaSuffix}`;
  if (impresa) return `Impresa ${impresa}${zonaSuffix}`;
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
      idProducto: linea.id_producto,
      allowUnscoped: !hija,
    });
    const unidad =
      linea.unidad_medida?.trim() || UNIDAD_MEDIDA_VENTA_DEFAULT;
    return {
      producto,
      especificacion: nota,
      cantidadSolicitada: `${formatKgEs(linea.cantidad_pedida)} ${unidad}`,
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
  timeZone?: string;
}): OrdenTareaAlmacenPrintData {
  const {
    listRow,
    detalle,
    printedAt,
    hija,
    lineas,
    tareaIndex,
    tareaTotal,
    timeZone = "America/Cancun",
  } = input;
  const zonaId = resolveCuentaZonaHorariaId(timeZone);
  const zonaImpresionLabel = getCuentaZonaHorariaOption(zonaId).shortLabel;

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
        return created ? formatOrdenTareaImpresaAt(created, zonaId) : "";
      })(),
      impresa: formatOrdenTareaImpresaAt(printedAt, zonaId),
      zonaImpresionLabel,
      cliente: listRow.comprador,
      centroConsumo: hija?.almacen ?? "",
      numeroOrdenCliente: resolveNumeroOrdenClientePrint({ hijaNumeroPedido: hija?.numeroPedido, tareaTotal }),
      ordenTrabajo: formatOrdenTrabajoCorto(tareaIndex, tareaTotal),
      fechaEntrega: (() => {
        const f = hija?.fecha
          ? formatCapturaFecha(hija.fecha)
          : formatFechaEntrega(listRow.fecha);
        return f;
      })(),
      diaEntrega: (() => {
        const f = hija?.fecha
          ? formatCapturaFecha(hija.fecha)
          : formatFechaEntrega(listRow.fecha);
        return diaSemanaEntregaEs(f);
      })(),
      horaEntrega: "",
      direccionEntrega:
        listRow.destino.trim() === "—" ? "" : listRow.destino,
      notasGenerales: "",
      lineas: [],
    };
  }

  const captura = parseOrdenVentaCapturaObservaciones(detalle.observaciones);
  const direccionCaptura = captura.direccion.trim();
  const { fechaEntrega, diaEntrega } = resolveFechaYDiaEntregaDesdeDetalle({
    fechaCaptura: captura.fechaEntrega,
    fechaEntregaBd: detalle.fecha_entrega,
    fechaPedido: detalle.fecha_pedido,
    createdAt: detalle.created_at,
  });

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
      return created ? formatOrdenTareaImpresaAt(created, timeZone) : "";
    })(),
    impresa: formatOrdenTareaImpresaAt(printedAt, zonaId),
    zonaImpresionLabel,
    cliente:
      detalle.comprador_razon_social?.trim() ||
      formatCompradorNombreOrdenVenta(detalle),
    clienteDenominacionComercial: (detalle.denominacion_comercial_override ?? detalle.comprador_denominacion_comercial_override)?.trim() || detalle.comprador_apodo?.trim() || "",
    // REQ-281: cabecera del PDF = detalle BD (no Almacen/Fecha de Mateo por OT).
    centroConsumo: resolveCentroConsumoDesdeDetalle({
      centroBd: detalle.centro_consumo,
      centroCaptura: captura.centroConsumo,
    }),
    numeroOrdenCliente: resolveNumeroOrdenClientePrint({ ordenCompraHotel: detalle.orden_compra_hotel, hijaNumeroPedido: hija?.numeroPedido, capturaOrdenCompra: captura.ordenCompraHotel, tareaTotal }),
    ordenTrabajo: formatOrdenTrabajoCorto(tareaIndex, tareaTotal),
    fechaEntrega,
    diaEntrega,
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
    notasGenerales: resolveNotasGeneralesDesdeDetalle(
      detalle.notas_almacen?.trim() || "",
      detalle.origen_correo,
    ),
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

export function formatOrdenTareaMetaLabel(data: {
  tareaIndex?: number;
  tareaTotal?: number;
}): string {
  const index = data.tareaIndex && data.tareaIndex > 0 ? data.tareaIndex : 1;
  const total = data.tareaTotal && data.tareaTotal > 0 ? data.tareaTotal : 1;
  return `Orden de tarea ${index}/${total}`;
}
