import {
  applyTenantFilters,
  DEFAULT_LIST_LIMIT,
  requireCodigoCuenta,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import type {
  EvidenciaTransporteRow,
  GuiaEnvioRow,
  TransportListParams,
} from "../types/transport.types";

const GUIA_COLUMNS =
  "id_guia,codigo_cuenta,id_viaje,id_orden_venta,codigo,destino,estado,created_at,updated_at";

const EVIDENCIA_COLUMNS =
  "id_evidencia,id_guia,id_linea_orden_venta,tipo,url_cloudinary,cantidad_entregada,incidencia,entrega_conforme,created_at";

// TODO POL-5+: asignar viajes y cerrar guías vía apiRequest al API Nest.

export async function listGuiasEnvio(
  params: TransportListParams,
): Promise<GuiaEnvioRow[]> {
  const limit = params.limit ?? DEFAULT_LIST_LIMIT;

  return runDomainQuery((client) => {
    const query = applyTenantFilters(
      client.from("guia_envio").select(GUIA_COLUMNS),
      params,
    )
      .order("created_at", { ascending: false })
      .limit(limit);

    return query as unknown as Promise<{
      data: GuiaEnvioRow[] | null;
      error: { message: string } | null;
    }>;
  });
}

export async function listEvidenciasTransporte(
  params: TransportListParams,
): Promise<EvidenciaTransporteRow[]> {
  const limit = params.limit ?? DEFAULT_LIST_LIMIT;
  requireCodigoCuenta(params.codigoCuenta);

  return runDomainQuery((client) => {
    let query = client
      .from("evidencia_transporte")
      .select(EVIDENCIA_COLUMNS);

    if (params.idGuia) {
      query = query.eq("id_guia", params.idGuia);
    }

    return query
      .order("created_at", { ascending: false })
      .limit(limit) as unknown as Promise<{
      data: EvidenciaTransporteRow[] | null;
      error: { message: string } | null;
    }>;
  });
}
