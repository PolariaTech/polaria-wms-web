import {
  DEFAULT_LIST_LIMIT,
  requireIdBodega,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import type {
  WarehouseStateListParams,
  WarehouseStateRow,
} from "../types/inventory.types";

const WAREHOUSE_STATE_COLUMNS =
  "id_warehouse_state,codigo_cuenta,id_bodega,id_ubicacion,id_producto,id_lote,cantidad,cantidad_reservada,temperatura,locked_by,locked_at,version,updated_at";

// TODO POL-5+: escrituras de inventario vía apiRequest al API Nest.

/** Lista posiciones de inventario (`warehouse_state`) para una bodega. */
export async function listWarehouseState(
  params: WarehouseStateListParams,
): Promise<WarehouseStateRow[]> {
  const idBodega = requireIdBodega(params.idBodega);
  const limit = params.limit ?? DEFAULT_LIST_LIMIT;

  return runDomainQuery((client) => {
    let query = client
      .from("warehouse_state")
      .select(WAREHOUSE_STATE_COLUMNS)
      .eq("id_bodega", idBodega)
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (params.codigoCuenta) {
      query = query.eq("codigo_cuenta", params.codigoCuenta);
    }

    return query as unknown as Promise<{
      data: WarehouseStateRow[] | null;
      error: { message: string } | null;
    }>;
  });
}
