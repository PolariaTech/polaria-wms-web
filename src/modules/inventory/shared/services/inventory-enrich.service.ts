import {
  DEFAULT_LIST_LIMIT,
  requireIdBodega,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import type { WarehouseStateRow } from "../types/inventory.types";

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function hasOrdenCompra(row: WarehouseStateRow): boolean {
  const lote = unwrapOne(row.lote);
  const linea = unwrapOne(lote?.orden_compra_linea);
  const orden = unwrapOne(linea?.orden_compra);
  return Boolean(orden?.codigo);
}

interface OrdenLineaEnrichRow {
  id_linea_orden_compra: string;
  id_producto: string;
  id_orden_compra: string;
  orden_compra:
    | {
        id_orden_compra: string;
        codigo: string | null;
        id_proveedor: string | null;
        id_bodega: string;
        proveedor:
          | {
              id_proveedor: string;
              razon_social: string | null;
              codigo: string | null;
            }
          | {
              id_proveedor: string;
              razon_social: string | null;
              codigo: string | null;
            }[]
          | null;
      }
    | {
        id_orden_compra: string;
        codigo: string | null;
        id_proveedor: string | null;
        id_bodega: string;
        proveedor:
          | {
              id_proveedor: string;
              razon_social: string | null;
              codigo: string | null;
            }
          | {
              id_proveedor: string;
              razon_social: string | null;
              codigo: string | null;
            }[]
          | null;
      }[]
    | null;
}

/** Completa orden de compra / proveedor cuando el lote aún no trae la línea. */
export async function enrichWarehouseStateOrdenCompra(
  rows: WarehouseStateRow[],
  idBodega: string,
): Promise<WarehouseStateRow[]> {
  const missing = rows.filter((row) => !hasOrdenCompra(row) && row.id_producto);
  if (missing.length === 0) {
    return rows;
  }

  const productIds = [...new Set(missing.map((row) => row.id_producto))];
  const resolvedIdBodega = requireIdBodega(idBodega);

  let lineas: OrdenLineaEnrichRow[] = [];
  try {
    lineas = await runDomainQuery<OrdenLineaEnrichRow[]>((client) => {
      const query = client
        .from("orden_compra_linea")
        .select(
          "id_linea_orden_compra,id_producto,id_orden_compra," +
            "orden_compra!inner(id_orden_compra,codigo,id_proveedor,id_bodega," +
            "proveedor:proveedor(id_proveedor,razon_social,codigo))",
        )
        .eq("orden_compra.id_bodega", resolvedIdBodega)
        .in("id_producto", productIds)
        .limit(DEFAULT_LIST_LIMIT);

      return query as unknown as Promise<{
        data: OrdenLineaEnrichRow[] | null;
        error: { message: string } | null;
      }>;
    });
  } catch {
    return rows;
  }

  const byProducto = new Map<string, OrdenLineaEnrichRow>();
  for (const linea of lineas) {
    if (!byProducto.has(linea.id_producto)) {
      byProducto.set(linea.id_producto, linea);
    }
  }

  return rows.map((row) => {
    if (hasOrdenCompra(row)) return row;

    const match = byProducto.get(row.id_producto);
    if (!match) return row;

    const orden = unwrapOne(match.orden_compra);
    if (!orden) return row;

    const proveedor = unwrapOne(orden.proveedor);
    const currentLote = unwrapOne(row.lote);

    return {
      ...row,
      lote: {
        id_lote: currentLote?.id_lote ?? row.id_lote ?? "",
        codigo_lote: currentLote?.codigo_lote ?? null,
        id_cliente: currentLote?.id_cliente ?? null,
        id_proveedor: currentLote?.id_proveedor ?? orden.id_proveedor ?? null,
        id_linea_orden_compra: match.id_linea_orden_compra,
        cliente: currentLote?.cliente ?? null,
        proveedor: currentLote?.proveedor ?? proveedor,
        orden_compra_linea: {
          id_linea_orden_compra: match.id_linea_orden_compra,
          id_orden_compra: match.id_orden_compra,
          orden_compra: {
            id_orden_compra: orden.id_orden_compra,
            codigo: orden.codigo,
          },
        },
      },
    };
  });
}
