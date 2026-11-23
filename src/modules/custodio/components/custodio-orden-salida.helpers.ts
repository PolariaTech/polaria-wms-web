import { cn } from "@/lib/utils/cn";
import {
  formatCamionId,
  type CamionListRow,
} from "@/modules/admin-panel/camiones/services/camiones.service";
import type {
  OrdenVentaDetalleRow,
  OrdenVentaOperadorRow,
} from "@/modules/sales";

export type PickerKind = "paquete" | "detalle" | "camion" | null;

export interface PreviewProductoRow {
  key: string;
  venta: string;
  comprador: string;
  producto: string;
  cantidadKg: number;
}

export const ESTADOS_VENTA_ACTIVA = [
  "confirmada",
  "en_preparacion",
  "alistamiento",
  "alistada",
  "revisada",
  "facturada",
  "parcialmente_despachada",
  "despachada",
  "embarcada",
];

export function truckLabel(truck: CamionListRow): string {
  const code = truck.codigo?.trim() || formatCamionId(truck.idCamion);
  return `${truck.placa} · ${code}`;
}

export function lineaProductoLabel(
  linea: OrdenVentaDetalleRow["lineas"][number],
): string {
  const producto = linea.producto;
  const sku = producto?.sku?.trim();
  const desc = producto?.descripcion?.trim();
  if (sku && desc) return `${sku} ${desc}`;
  return desc || sku || "Producto";
}

export const secondaryButtonClass = cn(
  "inline-flex w-full items-center justify-center gap-2 rounded-xl",
  "border border-polaria-t-20 bg-polaria-w-08 px-4 py-2.5",
  "polaria-text-body-sm font-medium text-polaria-w",
  "transition hover:border-polaria-teal hover:text-polaria-teal",
  "disabled:cursor-not-allowed disabled:opacity-60",
);

export const primaryButtonClass = cn(
  "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5",
  "bg-polaria-teal polaria-text-body-sm font-semibold text-polaria-on-teal",
  "transition hover:opacity-90",
  "disabled:cursor-not-allowed disabled:opacity-50",
);

export function buildPreviewRows(params: {
  previewIds: string[];
  previewByOrden: Record<string, OrdenVentaDetalleRow>;
  ventasActivas: OrdenVentaOperadorRow[];
  loadingPreview: boolean;
}): PreviewProductoRow[] {
  const { previewIds, previewByOrden, ventasActivas, loadingPreview } = params;
  const rows: PreviewProductoRow[] = [];
  for (const id of previewIds) {
    const detalle = previewByOrden[id];
    const venta = ventasActivas.find((row) => row.idOrdenVenta === id) ?? null;
    const ventaLabel = venta?.venta ?? detalle?.codigo ?? id;
    const compradorLabel =
      venta?.comprador ?? detalle?.comprador_nombre ?? "—";
    const lineas = detalle?.lineas ?? [];
    if (lineas.length === 0) {
      if (!loadingPreview) {
        rows.push({
          key: `${id}-empty`,
          venta: ventaLabel,
          comprador: compradorLabel,
          producto: "Sin líneas",
          cantidadKg: 0,
        });
      }
      continue;
    }
    for (const linea of lineas) {
      rows.push({
        key: linea.id_linea_orden_venta,
        venta: ventaLabel,
        comprador: compradorLabel,
        producto: lineaProductoLabel(linea),
        cantidadKg: linea.cantidad_pedida,
      });
    }
  }
  return rows;
}
