import {
  applyTenantFilters,
  AUDIT_LIST_LIMIT,
  type TenantListParams,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import type { AuditoriaOperacionRow } from "../types/audit.types";

const AUDITORIA_COLUMNS =
  "id_auditoria,codigo_cuenta,id_bodega,id_usuario,accion,entidad,entidad_id,payload,created_at";

// TODO POL-5+: exportaciones y reportes avanzados vía apiRequest al API Nest.

/** Lectura limitada de auditoría operativa para reportería. */
export async function listAuditoriaOperacion(
  params: TenantListParams,
): Promise<AuditoriaOperacionRow[]> {
  const limit = params.limit ?? AUDIT_LIST_LIMIT;

  return runDomainQuery((client) => {
    const query = applyTenantFilters(
      client.from("auditoria_operacion").select(AUDITORIA_COLUMNS),
      params,
    )
      .order("created_at", { ascending: false })
      .limit(limit);

    return query as unknown as Promise<{
      data: AuditoriaOperacionRow[] | null;
      error: { message: string } | null;
    }>;
  });
}
