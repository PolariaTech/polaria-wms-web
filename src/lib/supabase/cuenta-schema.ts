import {
  getDomainSupabaseClient,
  runDomainQuery,
  setTenantSchemaGetter,
} from "@/lib/supabase/domain-query";
import { listEmpresaSchemas } from "@/lib/supabase/tenant-fanout";
import { DomainServiceError } from "@/lib/utils/domain-service-error";

type CuentaSchemaRow = {
  codigo_cuenta: string;
  codigo_empresa: string;
};

const CUENTA_SCHEMA_SELECT = "codigo_cuenta,codigo_empresa";

async function locateCuenta(codigoCuenta: string): Promise<CuentaSchemaRow | null> {
  const client = getDomainSupabaseClient();

  const { data: publicData, error: publicError } = await client
    .schema("public")
    .from("cuenta")
    .select(CUENTA_SCHEMA_SELECT)
    .eq("codigo_cuenta", codigoCuenta)
    .limit(1);

  if (publicError) {
    console.warn("[cuenta-schema] public.cuenta:", publicError.message);
  }

  const publicRow = (publicData as CuentaSchemaRow[] | null)?.[0];
  if (publicRow) return publicRow;

  const empresas = await listEmpresaSchemas();
  for (const empresa of empresas) {
    if (!empresa.schema_name) continue;

    const { data, error } = await client
      .schema(empresa.schema_name)
      .from("cuenta")
      .select(CUENTA_SCHEMA_SELECT)
      .eq("codigo_cuenta", codigoCuenta)
      .limit(1);

    if (error) {
      console.warn(
        `[cuenta-schema] ${empresa.schema_name}.cuenta:`,
        error.message,
      );
      continue;
    }

    const row = (data as CuentaSchemaRow[] | null)?.[0];
    if (row) return row;
  }

  return null;
}

async function resolveEmpresaSchemaName(
  codigoEmpresa: string,
): Promise<string | null> {
  const rows = await runDomainQuery<{ schema_name: string | null }[]>(
    (client) => {
      const query = client
        .from("empresa")
        .select("schema_name")
        .eq("codigo_empresa", codigoEmpresa)
        .limit(1);

      return query as unknown as Promise<{
        data: { schema_name: string | null }[] | null;
        error: { message: string } | null;
      }>;
    },
  );

  return rows[0]?.schema_name ?? null;
}

/**
 * Ejecuta trabajo contra el schema emp_* de la empresa dueña de la cuenta.
 * El configurador (platform) no tiene schema en sesión: hay que apuntarlo aquí.
 */
export async function withCuentaSchema<T>(
  codigoCuenta: string,
  fn: () => Promise<T>,
): Promise<T> {
  const codigo = codigoCuenta.trim();
  if (!codigo) {
    throw new DomainServiceError(
      "El código de la cuenta es obligatorio.",
      "INVALID_ARGUMENT",
    );
  }

  const cuenta = await locateCuenta(codigo);
  if (!cuenta) {
    throw new DomainServiceError("Cuenta no encontrada.", "INVALID_ARGUMENT");
  }

  const schemaName = await resolveEmpresaSchemaName(cuenta.codigo_empresa);
  if (!schemaName) {
    return fn();
  }

  const previous = setTenantSchemaGetter(() => schemaName);
  try {
    return await fn();
  } finally {
    setTenantSchemaGetter(previous);
  }
}
