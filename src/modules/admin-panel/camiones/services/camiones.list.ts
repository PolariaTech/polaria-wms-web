import {
  DEFAULT_LIST_LIMIT,
  requireCodigoCuenta,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import { mapCamionRow } from "./camiones.map";
import {
  CAMION_LIST_COLUMNS,
  type CamionDbRow,
  type CamionListRow,
  type ListCamionesParams,
} from "./camiones.types";

/** Lista camiones de la cuenta (scope tenant). */
export async function listCamionesAdmin(
  params: ListCamionesParams,
): Promise<CamionListRow[]> {
  const codigoCuenta = requireCodigoCuenta(params.codigoCuenta);
  const limit = params.limit ?? DEFAULT_LIST_LIMIT;
  const soloActivos = params.soloActivos !== false;

  const rows = await runDomainQuery<CamionDbRow[]>((client) => {
    let query = client
      .from("camion")
      .select(CAMION_LIST_COLUMNS)
      .eq("codigo_cuenta", codigoCuenta);

    if (soloActivos) {
      query = query.eq("esta_activo", true);
    }

    const finalQuery = query
      .order("created_at", { ascending: false })
      .limit(limit);

    return finalQuery as unknown as Promise<{
      data: CamionDbRow[] | null;
      error: { message: string } | null;
    }>;
  });

  return rows.map(mapCamionRow);
}