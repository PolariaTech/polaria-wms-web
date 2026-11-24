import {
  DEFAULT_LIST_LIMIT,
  getDomainSupabaseClient,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import { normalizeCodigoCuentaInput } from "@/lib/utils/generate-codigo-cuenta";
import {
  CUENTA_LIST_COLUMNS,
  type CuentaBodegaDbRow,
  type CuentaDbRow,
  type CuentaListRow,
  loadBodegasByCuenta,
  loadCuentasConCredencialesAuth,
  mapCuentaRow,
} from "./cuentas.service.shared";

/** Lista cuentas comerciales para el configurador (scope platform). */
export async function listCuentasConfigurator(): Promise<CuentaListRow[]> {
  const empresas = await runDomainQuery<
    { codigo_empresa: string; schema_name: string | null }[]
  >((client) => {
    const query = client
      .from("empresa")
      .select("codigo_empresa,schema_name")
      .limit(DEFAULT_LIST_LIMIT);

    return query as unknown as Promise<{
      data: { codigo_empresa: string; schema_name: string | null }[] | null;
      error: { message: string } | null;
    }>;
  });

  const byCodigo = new Map<string, CuentaDbRow>();
  const bodegasByCodigo = new Map<string, CuentaBodegaDbRow[]>();

  const publicRows = await runDomainQuery<CuentaDbRow[]>((client) => {
    // Forzar public: con schema emp_* activo, from("cuenta") iría al tenant.
    const query = client
      .schema("public")
      .from("cuenta")
      .select(CUENTA_LIST_COLUMNS)
      .order("nombre_comercial", { ascending: true })
      .limit(DEFAULT_LIST_LIMIT);

    return query as unknown as Promise<{
      data: CuentaDbRow[] | null;
      error: { message: string } | null;
    }>;
  });

  const publicBodegas = await loadBodegasByCuenta(
    (table) => getDomainSupabaseClient().schema("public").from(table),
    publicRows.map((row) => row.codigo_cuenta),
  );
  for (const row of publicRows) {
    byCodigo.set(row.codigo_cuenta, row);
    bodegasByCodigo.set(
      row.codigo_cuenta,
      publicBodegas.get(row.codigo_cuenta) ?? [],
    );
  }

  const client = getDomainSupabaseClient();
  for (const empresa of empresas) {
    if (!empresa.schema_name) continue;

    const { data, error } = await client
      .schema(empresa.schema_name)
      .from("cuenta")
      .select(CUENTA_LIST_COLUMNS)
      .order("nombre_comercial", { ascending: true })
      .limit(DEFAULT_LIST_LIMIT);

    if (error) {
      console.warn(`[cuentas] schema ${empresa.schema_name}:`, error.message);
      continue;
    }

    const rows = (data as CuentaDbRow[] | null) ?? [];
    let bodegas = new Map<string, CuentaBodegaDbRow[]>();
    try {
      bodegas = await loadBodegasByCuenta(
        (table) => client.schema(empresa.schema_name!).from(table),
        rows.map((row) => row.codigo_cuenta),
      );
    } catch (bodegaError) {
      console.warn(`[cuentas] bodegas ${empresa.schema_name}:`, bodegaError);
    }

    for (const row of rows) {
      byCodigo.set(row.codigo_cuenta, row);
      bodegasByCodigo.set(
        row.codigo_cuenta,
        bodegas.get(row.codigo_cuenta) ?? [],
      );
    }
  }

  const conCredenciales = await loadCuentasConCredencialesAuth([
    ...byCodigo.keys(),
  ]);

  return [...byCodigo.values()]
    .map((row) =>
      mapCuentaRow(
        row,
        bodegasByCodigo.get(row.codigo_cuenta) ?? [],
        conCredenciales.has(row.codigo_cuenta),
      ),
    )
    .sort((a, b) => a.nombreComercial.localeCompare(b.nombreComercial, "es"));
}

export interface CuentaGobiernoListRow extends CuentaListRow {
  empresaNombre: string;
}

function withEmpresaNombre(
  cuenta: CuentaListRow,
  razonByCodigo: Map<string, string>,
): CuentaGobiernoListRow {
  return {
    ...cuenta,
    empresaNombre:
      razonByCodigo.get(cuenta.codigoEmpresa) ?? cuenta.codigoEmpresa,
  };
}

/** Cuentas de toda la plataforma, con razón social de empresa para gobierno TI. */
export async function listCuentasGobiernoConfigurator(): Promise<
  CuentaGobiernoListRow[]
> {
  const [cuentas, empresas] = await Promise.all([
    listCuentasConfigurator(),
    listEmpresasAssignOptions(),
  ]);
  const razonByCodigo = new Map(
    empresas.map((empresa) => [empresa.codigoEmpresa, empresa.razonSocial]),
  );

  return cuentas.map((cuenta) => withEmpresaNombre(cuenta, razonByCodigo));
}

export async function getCuentaGobiernoConfigurator(
  codigoCuenta: string,
): Promise<CuentaGobiernoListRow | null> {
  const codigo = normalizeCodigoCuentaInput(codigoCuenta);
  if (!codigo) return null;

  const cuentas = await listCuentasGobiernoConfigurator();
  return cuentas.find((cuenta) => cuenta.codigoCuenta === codigo) ?? null;
}

export interface EmpresaAssignOption {
  codigoEmpresa: string;
  razonSocial: string;
  telefono: string | null;
}

export interface CreateCuentaInput {
  codigoCuenta: string;
  nombreComercial: string;
  codigoEmpresa: string;
  idCreador?: string | null;
}

/** Empresas activas para asociar una cuenta comercial nueva. */
export async function listEmpresasAssignOptions(): Promise<EmpresaAssignOption[]> {
  const rows = await runDomainQuery<
    {
      codigo_empresa: string;
      razon_social: string;
      telefono: string | null;
    }[]
  >((client) => {
    const query = client
      .from("empresa")
      .select("codigo_empresa,razon_social,telefono")
      .eq("esta_activa", true)
      .order("razon_social", { ascending: true })
      .limit(DEFAULT_LIST_LIMIT);

    return query as unknown as Promise<{
      data:
        | {
            codigo_empresa: string;
            razon_social: string;
            telefono: string | null;
          }[]
        | null;
      error: { message: string } | null;
    }>;
  });

  return rows.map((row) => ({
    codigoEmpresa: row.codigo_empresa,
    razonSocial: row.razon_social,
    telefono: row.telefono,
  }));
}
