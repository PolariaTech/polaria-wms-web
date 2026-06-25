import {
  applyTenantFilters,
  DEFAULT_LIST_LIMIT,
  type TenantListParams,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import type {
  SolicitudProcesamientoRow,
  TareaColaRow,
} from "../types/processing.types";

const SOLICITUD_PROC_COLUMNS =
  "id_solicitud_procesamiento,codigo_cuenta,id_bodega,codigo,id_cliente,id_producto_primario,id_producto_secundario,id_solicitante,id_procesador,estado,kilos_primario,kilos_secundario,kilos_merma,created_at,updated_at";

const TAREA_COLA_COLUMNS =
  "id_tarea,codigo_cuenta,id_bodega,tipo,estado,id_asignado,id_orden_trabajo,titulo,descripcion,created_at,updated_at";

// TODO POL-5+: cerrar solicitudes de procesamiento vía apiRequest al API Nest.

export async function listSolicitudesProcesamiento(
  params: TenantListParams,
): Promise<SolicitudProcesamientoRow[]> {
  const limit = params.limit ?? DEFAULT_LIST_LIMIT;

  return runDomainQuery((client) => {
    const query = applyTenantFilters(
      client.from("solicitud_procesamiento").select(SOLICITUD_PROC_COLUMNS),
      params,
    )
      .order("created_at", { ascending: false })
      .limit(limit);

    return query as unknown as Promise<{
      data: SolicitudProcesamientoRow[] | null;
      error: { message: string } | null;
    }>;
  });
}

export async function listTareasCola(
  params: TenantListParams,
): Promise<TareaColaRow[]> {
  const limit = params.limit ?? DEFAULT_LIST_LIMIT;

  return runDomainQuery((client) => {
    const query = applyTenantFilters(
      client.from("tarea_cola").select(TAREA_COLA_COLUMNS),
      params,
    )
      .order("created_at", { ascending: false })
      .limit(limit);

    return query as unknown as Promise<{
      data: TareaColaRow[] | null;
      error: { message: string } | null;
    }>;
  });
}
