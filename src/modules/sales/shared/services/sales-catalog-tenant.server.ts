import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getTenantSchemaCache,
  setTenantSchemaCache,
} from "./sales-catalog-cache.server";

export type TenantFrom = ReturnType<SupabaseClient["from"]>;

/**
 * Resuelve el schema de negocio (public | emp_*) donde vive la cuenta.
 * Sin esto el admin de Supabase solo lee `public` y el catálogo queda vacío
 * para tenants en schemas propios.
 */
export async function resolveTenantSchemaForCuenta(
  admin: SupabaseClient,
  codigoCuenta: string,
): Promise<string | null> {
  const codigo = codigoCuenta.trim();
  if (!codigo) return null;

  const cached = getTenantSchemaCache(codigo);
  if (cached !== undefined) return cached;

  const { data: publicCuenta, error: publicError } = await admin
    .from("cuenta")
    .select("codigo_cuenta,codigo_empresa")
    .eq("codigo_cuenta", codigo)
    .eq("esta_activa", true)
    .limit(1)
    .maybeSingle();

  if (publicError) {
    throw new Error(publicError.message);
  }

  if (publicCuenta?.codigo_empresa) {
    const { data: empresa, error: empresaError } = await admin
      .from("empresa")
      .select("schema_name")
      .eq("codigo_empresa", publicCuenta.codigo_empresa)
      .limit(1)
      .maybeSingle();

    if (empresaError) {
      throw new Error(empresaError.message);
    }

    const schemaName = empresa?.schema_name?.trim() || null;
    // Si la empresa tiene schema propio, el negocio (producto, bodega, …) vive ahí.
    const resolved = schemaName || null;
    setTenantSchemaCache(codigo, resolved);
    return resolved;
  }

  const { data: empresas, error: listError } = await admin
    .from("empresa")
    .select("schema_name")
    .not("schema_name", "is", null)
    .limit(500);

  if (listError) {
    throw new Error(listError.message);
  }

  for (const empresa of empresas ?? []) {
    const schemaName = empresa.schema_name?.trim();
    if (!schemaName) continue;

    const { data, error } = await admin
      .schema(schemaName)
      .from("cuenta")
      .select("codigo_cuenta")
      .eq("codigo_cuenta", codigo)
      .eq("esta_activa", true)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn(
        `[sales-catalog.server] cuenta ${schemaName}:`,
        error.message,
      );
      continue;
    }

    if (data?.codigo_cuenta) {
      setTenantSchemaCache(codigo, schemaName);
      return schemaName;
    }
  }

  setTenantSchemaCache(codigo, null);
  return null;
}

export function tenantFrom(
  admin: SupabaseClient,
  schemaName: string | null,
): (table: string) => TenantFrom {
  return (table: string) =>
    schemaName
      ? (admin.schema(schemaName).from(table) as TenantFrom)
      : admin.from(table);
}
