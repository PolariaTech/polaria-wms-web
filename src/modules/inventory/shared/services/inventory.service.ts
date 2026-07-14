import {
  DEFAULT_LIST_LIMIT,
  requireIdBodega,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import type {
  WarehouseStateListParams,
  WarehouseStateRow,
} from "../types/inventory.types";
import { enrichWarehouseStateOrdenCompra } from "./inventory-enrich.service";

const WAREHOUSE_STATE_COLUMNS =
  "id_warehouse_state,codigo_cuenta,id_bodega,id_ubicacion,id_producto,id_lote,cantidad,cantidad_reservada,temperatura,locked_by,locked_at,version,updated_at";

const WAREHOUSE_STATE_ENRICHED_SELECT =
  `${WAREHOUSE_STATE_COLUMNS},` +
  "producto:producto(id_producto,sku,descripcion,id_cliente,metadatos_catalogo)," +
  "cuenta:cuenta(codigo_cuenta,nombre_comercial)," +
  "lote:lote(" +
  "id_lote,codigo_lote,id_cliente,id_proveedor,id_linea_orden_compra," +
  "cliente:cliente(id_cliente,nombre,codigo)," +
  "proveedor:proveedor(id_proveedor,razon_social,codigo)," +
  "orden_compra_linea:orden_compra_linea(" +
  "id_linea_orden_compra,id_orden_compra," +
  "orden_compra:orden_compra(id_orden_compra,codigo)" +
  ")" +
  ")";

// Escrituras de inventario (lock/unlock) vía inventory-api.service al API Nest.

/** Lista posiciones de inventario (`warehouse_state`) para una bodega. */
export async function listWarehouseState(
  params: WarehouseStateListParams,
): Promise<WarehouseStateRow[]> {
  const idBodega = requireIdBodega(params.idBodega);
  const limit = params.limit ?? DEFAULT_LIST_LIMIT;

  const rows = await runDomainQuery((client) => {
    let query = client
      .from("warehouse_state")
      .select(WAREHOUSE_STATE_ENRICHED_SELECT)
      .eq("id_bodega", idBodega)
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (params.codigoCuenta) {
      query = query.eq("codigo_cuenta", params.codigoCuenta);
    }

    if (params.idUbicacion?.trim()) {
      query = query.eq("id_ubicacion", params.idUbicacion.trim());
    }

    return query as unknown as Promise<{
      data: WarehouseStateRow[] | null;
      error: { message: string } | null;
    }>;
  });

  return enrichWarehouseStateOrdenCompra(rows, idBodega);
}
