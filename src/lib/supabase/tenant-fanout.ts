import {
  DEFAULT_LIST_LIMIT,
  getDomainSupabaseClient,
  runDomainQuery,
} from "@/lib/supabase/domain-query";

export type EmpresaSchemaRow = {
  codigo_empresa: string;
  schema_name: string | null;
};

export type CuentaFanoutRow = {
  codigo_cuenta: string;
  codigo_empresa: string;
  nombre_comercial: string;
  esta_activa: boolean;
};

export type BodegaFanoutRow = {
  id_bodega: string;
  nombre: string;
  codigo: string;
  codigo_cuenta: string;
  capacidad_slots: number | null;
  tipo: string;
  esta_activa: boolean;
};

/** Empresas con schema_name (public siempre se consulta aparte). */
export async function listEmpresaSchemas(): Promise<EmpresaSchemaRow[]> {
  return runDomainQuery<EmpresaSchemaRow[]>((client) => {
    const query = client
      .from("empresa")
      .select("codigo_empresa,schema_name")
      .limit(DEFAULT_LIST_LIMIT);

    return query as unknown as Promise<{
      data: EmpresaSchemaRow[] | null;
      error: { message: string } | null;
    }>;
  });
}

/** Cuenta activa en public o emp_*. */
export async function findCuentaAcrossSchemas(
  codigoCuenta: string,
): Promise<CuentaFanoutRow | null> {
  const codigo = codigoCuenta.trim();
  if (!codigo) return null;

  const publicRows = await runDomainQuery<CuentaFanoutRow[]>((client) => {
    const query = client
      .from("cuenta")
      .select("codigo_cuenta,codigo_empresa,nombre_comercial,esta_activa")
      .eq("codigo_cuenta", codigo)
      .eq("esta_activa", true)
      .limit(1);

    return query as unknown as Promise<{
      data: CuentaFanoutRow[] | null;
      error: { message: string } | null;
    }>;
  });

  if (publicRows[0]) return publicRows[0];

  const client = getDomainSupabaseClient();
  const empresas = await listEmpresaSchemas();
  for (const empresa of empresas) {
    if (!empresa.schema_name) continue;

    const { data, error } = await client
      .schema(empresa.schema_name)
      .from("cuenta")
      .select("codigo_cuenta,codigo_empresa,nombre_comercial,esta_activa")
      .eq("codigo_cuenta", codigo)
      .eq("esta_activa", true)
      .limit(1);

    if (error) {
      console.warn(
        `[tenant-fanout] cuenta ${empresa.schema_name}:`,
        error.message,
      );
      continue;
    }

    const row = (data as CuentaFanoutRow[] | null)?.[0];
    if (row) return row;
  }

  return null;
}

/** Todas las cuentas activas en public + emp_*. */
export async function listCuentasAcrossSchemas(): Promise<CuentaFanoutRow[]> {
  const byCodigo = new Map<string, CuentaFanoutRow>();

  const publicRows = await runDomainQuery<CuentaFanoutRow[]>((client) => {
    const query = client
      .from("cuenta")
      .select("codigo_cuenta,codigo_empresa,nombre_comercial,esta_activa")
      .eq("esta_activa", true)
      .order("nombre_comercial", { ascending: true })
      .limit(DEFAULT_LIST_LIMIT);

    return query as unknown as Promise<{
      data: CuentaFanoutRow[] | null;
      error: { message: string } | null;
    }>;
  });

  for (const row of publicRows) {
    byCodigo.set(row.codigo_cuenta, row);
  }

  const client = getDomainSupabaseClient();
  const empresas = await listEmpresaSchemas();
  for (const empresa of empresas) {
    if (!empresa.schema_name) continue;

    const { data, error } = await client
      .schema(empresa.schema_name)
      .from("cuenta")
      .select("codigo_cuenta,codigo_empresa,nombre_comercial,esta_activa")
      .eq("esta_activa", true)
      .order("nombre_comercial", { ascending: true })
      .limit(DEFAULT_LIST_LIMIT);

    if (error) {
      console.warn(
        `[tenant-fanout] cuentas ${empresa.schema_name}:`,
        error.message,
      );
      continue;
    }

    for (const row of (data as CuentaFanoutRow[] | null) ?? []) {
      byCodigo.set(row.codigo_cuenta, row);
    }
  }

  return [...byCodigo.values()].sort((a, b) =>
    a.nombre_comercial.localeCompare(b.nombre_comercial, "es"),
  );
}

type BodegaListOptions = {
  tipo?: "interna" | "externa";
  /** Columnas PostgREST; por defecto sin embed frágil a cuenta. */
  select?: string;
};

/**
 * Bodegas activas en public + emp_*.
 * Sin embed a cuenta (PostgREST rompe en schemas tenant).
 */
export async function listBodegasAcrossSchemas(
  options: BodegaListOptions = {},
): Promise<BodegaFanoutRow[]> {
  const select =
    options.select ??
    "id_bodega,nombre,codigo,codigo_cuenta,capacidad_slots,tipo,esta_activa";
  const byId = new Map<string, BodegaFanoutRow>();

  const applyPublic = async () => {
    const rows = await runDomainQuery<BodegaFanoutRow[]>((client) => {
      let query = client.from("bodega").select(select).eq("esta_activa", true);

      if (options.tipo) {
        query = query.eq("tipo", options.tipo);
      }

      const finalized = query
        .order("nombre", { ascending: true })
        .limit(DEFAULT_LIST_LIMIT);

      return finalized as unknown as Promise<{
        data: BodegaFanoutRow[] | null;
        error: { message: string } | null;
      }>;
    });

    for (const row of rows) {
      if (!row.id_bodega?.trim()) continue;
      byId.set(row.id_bodega.trim(), row);
    }
  };

  await applyPublic();

  const client = getDomainSupabaseClient();
  const empresas = await listEmpresaSchemas();
  for (const empresa of empresas) {
    if (!empresa.schema_name) continue;

    let query = client
      .schema(empresa.schema_name)
      .from("bodega")
      .select(select)
      .eq("esta_activa", true)
      .order("nombre", { ascending: true })
      .limit(DEFAULT_LIST_LIMIT);

    if (options.tipo) {
      query = query.eq("tipo", options.tipo);
    }

    const { data, error } = await query;
    if (error) {
      console.warn(
        `[tenant-fanout] bodegas ${empresa.schema_name}:`,
        error.message,
      );
      continue;
    }

    for (const row of (data as BodegaFanoutRow[] | null) ?? []) {
      if (!row.id_bodega?.trim()) continue;
      byId.set(row.id_bodega.trim(), row);
    }
  }

  return [...byId.values()].sort((a, b) =>
    a.nombre.localeCompare(b.nombre, "es"),
  );
}

/** Nombres comerciales para códigos de cuenta (public + emp_*). */
export async function resolveNombresCuentaAcrossSchemas(
  codigosCuenta: string[],
): Promise<Map<string, string>> {
  const nombreByCodigo = new Map<string, string>();
  if (codigosCuenta.length === 0) return nombreByCodigo;

  const pending = new Set(codigosCuenta);
  const client = getDomainSupabaseClient();

  const publicRows = await runDomainQuery<
    { codigo_cuenta: string; nombre_comercial: string }[]
  >((c) => {
    const query = c
      .from("cuenta")
      .select("codigo_cuenta,nombre_comercial")
      .in("codigo_cuenta", [...pending]);

    return query as unknown as Promise<{
      data: { codigo_cuenta: string; nombre_comercial: string }[] | null;
      error: { message: string } | null;
    }>;
  });

  for (const row of publicRows) {
    nombreByCodigo.set(row.codigo_cuenta, row.nombre_comercial);
    pending.delete(row.codigo_cuenta);
  }

  if (pending.size === 0) return nombreByCodigo;

  const empresas = await listEmpresaSchemas();
  for (const empresa of empresas) {
    if (!empresa.schema_name || pending.size === 0) continue;

    const { data, error } = await client
      .schema(empresa.schema_name)
      .from("cuenta")
      .select("codigo_cuenta,nombre_comercial")
      .in("codigo_cuenta", [...pending]);

    if (error) continue;

    for (const row of (data as
      | { codigo_cuenta: string; nombre_comercial: string }[]
      | null) ?? []) {
      nombreByCodigo.set(row.codigo_cuenta, row.nombre_comercial);
      pending.delete(row.codigo_cuenta);
    }
  }

  return nombreByCodigo;
}
