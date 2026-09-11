import type {
  WarehouseStateProductoRel,
  WarehouseStateRow,
} from "@/modules/inventory/shared/types/inventory.types";
import { resolveProductoNombre } from "@/modules/warehouses/estado-bodega/utils/estado-bodega-slot-content";

/** Quita el SKU del inicio si el nombre ya lo trae concatenado. */
export function stripLeadingProductoCodigo(
  nombre: string,
  codigo: string,
): string {
  const name = nombre.trim();
  const code = codigo.trim();
  if (!name || !code || name === code) return name;

  const prefix = `${code} `;
  if (name.toLowerCase().startsWith(prefix.toLowerCase())) {
    return name.slice(prefix.length).trim() || name;
  }

  return name;
}

/** Nombre de catálogo para venta: título/descripción, sin repetir el código. */
export function resolveNombreProductoVenta(
  producto: WarehouseStateProductoRel | null | undefined,
  codigo: string,
): string {
  const nombre =
    resolveProductoNombre({ producto } as WarehouseStateRow, {
      includeSku: false,
    }) || `Producto ${codigo}`;

  return stripLeadingProductoCodigo(nombre, codigo);
}
