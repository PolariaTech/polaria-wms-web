import {
  DEFAULT_LIST_LIMIT,
  getDomainSupabaseClient,
  runDomainMutation,
  runDomainQuery,
  setTenantSchemaGetter,
} from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { normalizeCodigoCuentaInput } from "@/lib/utils/generate-codigo-cuenta";
import { ApiError, apiRequest } from "@/services/api/api";

export type CuentaBodegaTipo = "interna" | "externa" | string;

export interface CuentaBodegaAsignada {
  idBodega: string;
  nombre: string;
  tipo: CuentaBodegaTipo;
  capacidad: number | null;
}

export interface CuentaListRow {
  codigoCuenta: string;
  codigoEmpresa: string;
  nombreComercial: string;
  bodegasAsignadas: CuentaBodegaAsignada[];
  /** Primera bodega interna activa; si no hay, la primera bodega activa. */
  bodegaInternaPrincipal: CuentaBodegaAsignada | null;
  /**
   * Acceso de la cuenta (`cuenta.esta_activa`).
   * false → los usuarios de la cuenta no pueden iniciar sesión.
   */
  estaActiva: boolean;
  /**
   * Tiene al menos un usuario con Auth (correo + clave → `usuario.id_auth`).
   */
  tieneCredenciales: boolean;
}

interface CuentaBodegaDbRow {
  id_bodega: string;
  nombre: string;
  tipo: string;
  capacidad_slots: number | null;
  esta_activa: boolean;
}

interface CuentaDbRow {
  codigo_cuenta: string;
  codigo_empresa: string;
  nombre_comercial: string;
  esta_activa: boolean;
}

const CUENTA_LIST_COLUMNS =
  "codigo_cuenta,codigo_empresa,nombre_comercial,esta_activa";

const BODEGA_LIST_COLUMNS =
  "id_bodega,nombre,tipo,capacidad_slots,esta_activa,codigo_cuenta";

function mapBodegaAsignada(row: CuentaBodegaDbRow): CuentaBodegaAsignada {
  return {
    idBodega: row.id_bodega,
    nombre: row.nombre,
    tipo: row.tipo,
    capacidad: row.capacidad_slots,
  };
}

function resolveBodegaInternaPrincipal(
  bodegas: CuentaBodegaAsignada[],
): CuentaBodegaAsignada | null {
  if (bodegas.length === 0) return null;
  const internas = bodegas
    .filter((item) => item.tipo === "interna")
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  if (internas[0]) return internas[0];
  return (
    [...bodegas].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))[0] ??
    null
  );
}

function mapCuentaRow(
  row: CuentaDbRow,
  bodegas: CuentaBodegaDbRow[] = [],
  tieneCredenciales = false,
): CuentaListRow {
  const bodegasAsignadas = bodegas
    .filter((item) => item.esta_activa)
    .map(mapBodegaAsignada)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  return {
    codigoCuenta: row.codigo_cuenta,
    codigoEmpresa: row.codigo_empresa,
    nombreComercial: row.nombre_comercial,
    bodegasAsignadas,
    bodegaInternaPrincipal: resolveBodegaInternaPrincipal(bodegasAsignadas),
    estaActiva: row.esta_activa,
    tieneCredenciales,
  };
}

/** Cuentas con al menos un usuario ligado a Supabase Auth (correo/clave). */
async function loadCuentasConCredencialesAuth(
  codigosCuenta: string[],
): Promise<Set<string>> {
  const withAuth = new Set<string>();
  if (codigosCuenta.length === 0) return withAuth;

  const rows = await runDomainQuery<{ codigo_cuenta: string | null }[]>(
    (client) => {
      const query = client
        .from("usuario")
        .select("codigo_cuenta")
        .in("codigo_cuenta", codigosCuenta)
        .not("id_auth", "is", null)
        .limit(DEFAULT_LIST_LIMIT);

      return query as unknown as Promise<{
        data: { codigo_cuenta: string | null }[] | null;
        error: { message: string } | null;
      }>;
    },
  );

  for (const row of rows) {
    const codigo = row.codigo_cuenta?.trim();
    if (codigo) withAuth.add(codigo);
  }

  return withAuth;
}

async function loadBodegasByCuenta(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fromFn: (table: string) => any,
  codigosCuenta: string[],
): Promise<Map<string, CuentaBodegaDbRow[]>> {
  const byCuenta = new Map<string, CuentaBodegaDbRow[]>();
  if (codigosCuenta.length === 0) return byCuenta;

  const { data, error } = await fromFn("bodega")
    .select(BODEGA_LIST_COLUMNS)
    .in("codigo_cuenta", codigosCuenta)
    .eq("esta_activa", true);

  if (error) {
    throw new DomainServiceError(
      error.message || "Error al consultar bodegas.",
      "QUERY_FAILED",
      error,
    );
  }

  for (const row of (data as (CuentaBodegaDbRow & {
    codigo_cuenta: string;
  })[] | null) ?? []) {
    const list = byCuenta.get(row.codigo_cuenta) ?? [];
    list.push(row);
    byCuenta.set(row.codigo_cuenta, list);
  }

  return byCuenta;
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

/** Ejecuta trabajo con search_path/schema emp_* de la empresa (configurador). */
async function withEmpresaSchema<T>(
  codigoEmpresa: string,
  fn: () => Promise<T>,
): Promise<T> {
  const schemaName = await resolveEmpresaSchemaName(codigoEmpresa);
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
    const query = client
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
    (table) => getDomainSupabaseClient().from(table),
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

/** Crea una cuenta comercial desde el configurador (scope platform). */
export async function createCuentaConfigurator(
  input: CreateCuentaInput,
): Promise<CuentaListRow> {
  const nombreComercial = input.nombreComercial.trim();
  const codigoCuenta = normalizeCodigoCuentaInput(input.codigoCuenta);
  const codigoEmpresa = input.codigoEmpresa.trim();

  if (!nombreComercial) {
    throw new DomainServiceError(
      "El nombre de la cuenta es obligatorio.",
      "INVALID_ARGUMENT",
    );
  }

  if (!codigoCuenta) {
    throw new DomainServiceError(
      "El código de la cuenta es obligatorio.",
      "INVALID_ARGUMENT",
    );
  }

  if (!codigoEmpresa) {
    throw new DomainServiceError(
      "Selecciona la empresa a asociar.",
      "INVALID_ARGUMENT",
    );
  }

  await withEmpresaSchema(codigoEmpresa, async () => {
    await runDomainMutation<{ codigo_cuenta: string } | null>((client) => {
      const query = client.from("cuenta").insert({
        codigo_cuenta: codigoCuenta,
        codigo_empresa: codigoEmpresa,
        nombre_comercial: nombreComercial,
        id_creador: input.idCreador ?? null,
        esta_activa: true,
      });

      return query as unknown as Promise<{
        data: { codigo_cuenta: string } | null;
        error: { message: string } | null;
      }>;
    });
  });

  return {
    codigoCuenta,
    codigoEmpresa,
    nombreComercial,
    bodegasAsignadas: [],
    bodegaInternaPrincipal: null,
    estaActiva: true,
    tieneCredenciales: false,
  };
}

export interface UpdateCuentaInput {
  codigoCuenta: string;
  nombreComercial: string;
  /** Acceso: false bloquea login de usuarios de la cuenta. */
  estaActiva: boolean;
}

/** Actualiza una cuenta vía API Nest (scope platform / configurador). */
export async function updateCuentaConfigurator(
  input: UpdateCuentaInput,
): Promise<{
  codigoCuenta: string;
  codigoEmpresa: string;
  nombreComercial: string;
  estaActiva: boolean;
}> {
  const codigoCuenta = normalizeCodigoCuentaInput(input.codigoCuenta);
  const nombreComercial = input.nombreComercial.trim();

  if (!codigoCuenta) {
    throw new DomainServiceError(
      "El código de la cuenta es obligatorio.",
      "INVALID_ARGUMENT",
    );
  }

  if (!nombreComercial) {
    throw new DomainServiceError(
      "El nombre de la cuenta es obligatorio.",
      "INVALID_ARGUMENT",
    );
  }

  try {
    return await apiRequest(
      `/configuracion/cuentas/${encodeURIComponent(codigoCuenta)}`,
      {
        method: "PATCH",
        auth: true,
        body: {
          nombreComercial,
          estaActiva: input.estaActiva,
        },
      },
    );
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw new DomainServiceError(error.message, "MUTATION_FAILED", error);
    }
    throw error;
  }
}
