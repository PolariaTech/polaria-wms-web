import type {
  CatalogoProductoListRow,
  ProveedorListRow,
} from "@/modules/admin-panel";

export interface OrdenCompraCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export interface DraftLine {
  idProducto: string;
  pesoKg: number;
  titleSnapshot: string;
  skuSnapshot?: string;
}

function todayInputValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function proveedorLabel(row: ProveedorListRow): string {
  return row.nombre && row.nombre !== row.proveedor
    ? `${row.proveedor} — ${row.nombre}`
    : row.proveedor;
}

function productoLabel(row: CatalogoProductoListRow): string {
  return row.sku && row.sku !== "—"
    ? `${row.titulo} · SKU ${row.sku}`
    : row.titulo;
}

export { todayInputValue, proveedorLabel, productoLabel };
