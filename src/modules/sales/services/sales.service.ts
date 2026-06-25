import {
  applyTenantFilters,
  DEFAULT_LIST_LIMIT,
  type TenantListParams,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import type { OrdenVentaRow } from "../types/sales.types";

const ORDEN_VENTA_COLUMNS =
  "id_orden_venta,codigo_cuenta,id_bodega,id_cliente,id_comprador,id_planta,id_creador,id_bodega_destino,codigo,estado,fecha_pedido,observaciones,created_at,updated_at";

// TODO POL-5+: confirmar y despachar OV vía apiRequest al API Nest.

export async function listOrdenesVenta(
  params: TenantListParams,
): Promise<OrdenVentaRow[]> {
  const limit = params.limit ?? DEFAULT_LIST_LIMIT;

  return runDomainQuery((client) => {
    const query = applyTenantFilters(
      client.from("orden_venta").select(ORDEN_VENTA_COLUMNS),
      params,
    )
      .order("created_at", { ascending: false })
      .limit(limit);

    return query as unknown as Promise<{
      data: OrdenVentaRow[] | null;
      error: { message: string } | null;
    }>;
  });
}
