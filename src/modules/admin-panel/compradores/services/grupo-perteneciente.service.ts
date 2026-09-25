import {
  requireCodigoCuenta,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { normalizeCompradorGrupoValues } from "../constants/comprador-grupos";

interface TmpGrupoPertenecienteDbRow {
  nombre: string;
  orden: number | null;
}

/** Catálogo de grupos pertenecientes (tabla temporal de prueba) para la cuenta. */
export async function listGruposPertenecientesAdmin(params: {
  codigoCuenta: string;
  limit?: number;
}): Promise<string[]> {
  const codigoCuenta = requireCodigoCuenta(params.codigoCuenta);
  const limit = Math.min(Math.max(params.limit ?? 200, 1), 500);

  let tmpRows: TmpGrupoPertenecienteDbRow[];
  try {
    tmpRows = await runDomainQuery<TmpGrupoPertenecienteDbRow[]>((client) => {
      const query = client
        .from("tmp_grupo_perteneciente")
        .select("nombre,orden")
        .eq("codigo_cuenta", codigoCuenta)
        .order("orden", { ascending: true })
        .order("nombre", { ascending: true })
        .limit(limit);

      return query as unknown as Promise<{
        data: TmpGrupoPertenecienteDbRow[] | null;
        error: { message: string } | null;
      }>;
    });
  } catch (error: unknown) {
    const message =
      error instanceof DomainServiceError
        ? error.message
        : error instanceof Error
          ? error.message
          : "";
    if (/tmp_grupo_perteneciente|does not exist|42P01/i.test(message)) {
      return [];
    }
    throw error;
  }

  return normalizeCompradorGrupoValues(tmpRows.map((row) => row.nombre));
}
