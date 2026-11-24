import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type TenantFrom = ReturnType<SupabaseClient["from"]>;

async function resolveTenantSchemaForCuenta(
  admin: SupabaseClient,
  codigoCuenta: string,
): Promise<string | null> {
  const codigo = codigoCuenta.trim();
  if (!codigo) return null;

  const { data: publicCuenta, error: publicError } = await admin
    .from("cuenta")
    .select("codigo_cuenta,codigo_empresa")
    .eq("codigo_cuenta", codigo)
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

    return empresa?.schema_name?.trim() || null;
  }

  const { data: empresas, error: empresasError } = await admin
    .from("empresa")
    .select("schema_name")
    .not("schema_name", "is", null)
    .limit(500);

  if (empresasError) {
    throw new Error(empresasError.message);
  }

  for (const empresa of empresas ?? []) {
    const schemaName = empresa.schema_name?.trim();
    if (!schemaName) continue;

    const { data, error } = await admin
      .schema(schemaName)
      .from("cuenta")
      .select("codigo_cuenta")
      .eq("codigo_cuenta", codigo)
      .limit(1)
      .maybeSingle();

    if (error) continue;
    if (data?.codigo_cuenta) return schemaName;
  }

  return null;
}

export async function tenantFrom(
  codigoCuenta: string,
): Promise<((table: string) => TenantFrom) | null> {
  const client = getSupabaseAdminClient();
  if (!client) return null;

  const schemaName = await resolveTenantSchemaForCuenta(client, codigoCuenta);
  return (table: string) =>
    schemaName
      ? (client.schema(schemaName).from(table) as TenantFrom)
      : client.from(table);
}

export function requireTenantFrom(
  from: ((table: string) => TenantFrom) | null,
): (table: string) => TenantFrom {
  if (!from) {
    throw new Error("No hay cliente de base de datos.");
  }
  return from;
}