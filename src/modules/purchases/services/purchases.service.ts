import {
  applyTenantFilters,
  DEFAULT_LIST_LIMIT,
  type TenantListParams,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import type {
  OrdenCompraRow,
  RecepcionCompraRow,
  SolicitudCompraRow,
} from "../types/purchases.types";

const SOLICITUD_COLUMNS =
  "id_solicitud_compra,codigo_cuenta,id_bodega,id_proveedor,id_orden_compra,codigo,estado,id_solicitante,observaciones,created_at,updated_at";

const ORDEN_COLUMNS =
  "id_orden_compra,codigo_cuenta,id_bodega,id_proveedor,id_solicitud_compra,id_creador,codigo,estado,fecha_emision,fecha_entrega_estimada,destino_tipo,observaciones,created_at,updated_at";

const RECEPCION_COLUMNS =
  "id_recepcion,codigo_cuenta,id_bodega,id_orden_compra,sin_diferencias,notas,cerrada_at,cerrada_por,created_at";

// TODO POL-5+: crear/aprobar solicitudes y órdenes vía apiRequest al API Nest.

export async function listSolicitudesCompra(
  params: TenantListParams,
): Promise<SolicitudCompraRow[]> {
  const limit = params.limit ?? DEFAULT_LIST_LIMIT;

  return runDomainQuery((client) => {
    const query = applyTenantFilters(
      client.from("solicitud_compra").select(SOLICITUD_COLUMNS),
      params,
    )
      .order("created_at", { ascending: false })
      .limit(limit);

    return query as unknown as Promise<{
      data: SolicitudCompraRow[] | null;
      error: { message: string } | null;
    }>;
  });
}

export async function listOrdenesCompra(
  params: TenantListParams,
): Promise<OrdenCompraRow[]> {
  const limit = params.limit ?? DEFAULT_LIST_LIMIT;

  return runDomainQuery((client) => {
    const query = applyTenantFilters(
      client.from("orden_compra").select(ORDEN_COLUMNS),
      params,
    )
      .order("created_at", { ascending: false })
      .limit(limit);

    return query as unknown as Promise<{
      data: OrdenCompraRow[] | null;
      error: { message: string } | null;
    }>;
  });
}

export async function listRecepciones(
  params: TenantListParams,
): Promise<RecepcionCompraRow[]> {
  const limit = params.limit ?? DEFAULT_LIST_LIMIT;

  return runDomainQuery((client) => {
    const query = applyTenantFilters(
      client.from("recepcion_compra").select(RECEPCION_COLUMNS),
      params,
    )
      .order("created_at", { ascending: false })
      .limit(limit);

    return query as unknown as Promise<{
      data: RecepcionCompraRow[] | null;
      error: { message: string } | null;
    }>;
  });
}
