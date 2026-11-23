import type { OrdenVentaDetalleRow } from "@/modules/sales";

export const PASOS_ENTREGA = 4;
export const MAX_EVIDENCIA_BYTES = 10 * 1024 * 1024;

export function firmaCanvasToDataUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL("image/jpeg", 0.82);
}

export async function dataUrlToFile(
  dataUrl: string,
  name: string,
): Promise<File> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], name, { type: blob.type || "image/jpeg" });
}

export function parseCantidad(raw: string): number | null {
  const normalized = raw.trim().replace(",", ".");
  if (!normalized) return null;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return null;
  return value;
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
