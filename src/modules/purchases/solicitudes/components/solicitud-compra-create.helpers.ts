import type {
  CatalogoProductoListRow,
  ProveedorListRow,
} from "@/modules/admin-panel";

export interface DraftLine {
  idProducto: string;
  pesoKg: number;
  titleSnapshot: string;
  skuSnapshot?: string;
}

export function proveedorLabel(row: ProveedorListRow): string {
  return row.nombre && row.nombre !== row.proveedor
    ? `${row.proveedor} — ${row.nombre}`
    : row.proveedor;
}

export function productoLabel(row: CatalogoProductoListRow): string {
  return row.sku && row.sku !== "—"
    ? `${row.titulo} · SKU ${row.sku}`
    : row.titulo;
}
