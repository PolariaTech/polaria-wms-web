import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolveTenantSchemaForCuenta } from "@/modules/sales/shared/services/sales-catalog.server";

/**
 * Lee `cuenta.ov_auto_imprimir` con service role (schema del tenant).
 * Evita que RLS del operador oculte el flag y se salte la autoimpresión.
 */
export async function getCuentaOvAutoImprimirServer(
  codigoCuenta: string,
): Promise<boolean> {
  const codigo = codigoCuenta.trim();
  if (!codigo) return false;

  const admin = getSupabaseAdminClient();
  if (!admin) {
    throw new Error(
      "Supabase admin no configurado (SUPABASE_SERVICE_ROLE_KEY).",
    );
  }

  const schemaName = await resolveTenantSchemaForCuenta(admin, codigo);
  const from = schemaName
    ? admin.schema(schemaName).from("cuenta")
    : admin.from("cuenta");

  const { data, error } = await from
    .select("ov_auto_imprimir")
    .eq("codigo_cuenta", codigo)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "No se pudo leer ov_auto_imprimir.");
  }

  return Boolean(
    (data as { ov_auto_imprimir?: boolean | null } | null)?.ov_auto_imprimir,
  );
}
