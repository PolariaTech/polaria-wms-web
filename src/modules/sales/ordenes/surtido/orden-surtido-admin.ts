import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveTenantSchemaForCuenta } from "@/modules/sales/shared/services/sales-catalog.server";

export interface OrdenAdminContext {
  schemaName: string | null;
  codigoCuenta: string;
  codigo: string;
}

export function adminFrom(
  admin: SupabaseClient,
  schemaName: string | null,
  table: string,
) {
  return schemaName
    ? admin.schema(schemaName).from(table)
    : admin.from(table);
}

export async function resolveOrdenAdminContext(
  admin: SupabaseClient,
  idOrdenVenta: string,
): Promise<OrdenAdminContext | null> {
  const readMeta = async (schemaName: string | null) => {
    const { data, error } = await adminFrom(admin, schemaName, "orden_venta")
      .select("id_orden_venta,codigo_cuenta,codigo")
      .eq("id_orden_venta", idOrdenVenta)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return {
      schemaName,
      codigoCuenta: String(data.codigo_cuenta ?? "").trim(),
      codigo: String(data.codigo ?? "").trim(),
    } satisfies OrdenAdminContext;
  };

  const inPublic = await readMeta(null);
  if (inPublic) {
    const tenantSchema = inPublic.codigoCuenta
      ? await resolveTenantSchemaForCuenta(admin, inPublic.codigoCuenta)
      : null;
    if (!tenantSchema) return inPublic;
    const inTenant = await readMeta(tenantSchema);
    return inTenant ?? inPublic;
  }

  const { data: empresas, error: empresasError } = await admin
    .from("empresa")
    .select("schema_name")
    .not("schema_name", "is", null)
    .limit(500);
  if (empresasError) throw new Error(empresasError.message);

  for (const empresa of empresas ?? []) {
    const schemaName =
      typeof empresa.schema_name === "string"
        ? empresa.schema_name.trim()
        : "";
    if (!schemaName) continue;
    const hit = await readMeta(schemaName);
    if (hit) return hit;
  }

  return null;
}

export function emptyToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}