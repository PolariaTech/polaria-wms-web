import { formatKgEs } from "@/lib/utils/decimal-es";
import type {
  OrdenVentaDetalleRow,
  OrdenVentaOperadorRow,
} from "../../shared/types/sales.types";
import {
  formatCompradorOrdenVenta,
  resolveOrdenVentaLineaTitulo,
} from "../utils/orden-venta-display";
import {
  formatCapturaFecha,
  notaCapturaForProducto,
  parseOrdenVentaCapturaObservaciones,
} from "../utils/build-orden-venta-captura-observaciones";
import type { OrdenTareaAlmacenPrintData } from "./orden-tarea-almacen.types";

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

export function mapOrdenVentaToAlmacenPrintData(input: {
  listRow: OrdenVentaOperadorRow;
  detalle: OrdenVentaDetalleRow | null;
  printedAt?: Date;
}): OrdenTareaAlmacenPrintData {
  const printedAt = input.printedAt ?? new Date();
  const detalle = input.detalle;
  const listRow = input.listRow;

  if (!detalle) {
    return {
      folio: listRow.venta,
      impresa: formatOrdenTareaImpresaAt(printedAt),
      cliente: listRow.comprador,
      centroConsumo: "",
      numeroOrdenCliente: listRow.venta,
      fechaEntrega: formatFechaEntrega(listRow.fecha),
      direccionEntrega:
        listRow.destino.trim() === "—" ? "" : listRow.destino,
      lineas: [],
    };
  }

  const captura = parseOrdenVentaCapturaObservaciones(detalle.observaciones);
  const direccionCaptura = captura.direccion.trim();
  const fechaEntregaCaptura = captura.fechaEntrega.trim();

  return {
    folio: detalle.codigo,
    impresa: formatOrdenTareaImpresaAt(printedAt),
    cliente: formatCompradorOrdenVenta(detalle),
    centroConsumo: captura.centroConsumo,
    numeroOrdenCliente: captura.ordenCompraHotel.trim() || detalle.codigo,
    fechaEntrega: fechaEntregaCaptura
      ? formatCapturaFecha(fechaEntregaCaptura)
      : formatFechaEntrega(detalle.fecha_pedido || detalle.created_at),
    direccionEntrega:
      direccionCaptura ||
      detalle.bodega_destino_nombre?.trim() ||
      detalle.bodega_nombre?.trim() ||
      "",
    lineas: (detalle.lineas ?? []).map((linea) => {
      const producto = resolveOrdenVentaLineaTitulo(linea);
      const nota = notaCapturaForProducto(captura.notasLineas, producto);
      return {
        producto,
        especificacion: nota || linea.producto?.sku?.trim() || "",
        cantidadSolicitada: `${formatKgEs(linea.cantidad_pedida)} kg`,
      };
    }),
  };
}
