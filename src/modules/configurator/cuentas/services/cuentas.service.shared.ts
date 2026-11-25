import {
  DEFAULT_LIST_LIMIT,
  runDomainQuery,
  setTenantSchemaGetter,
} from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/utils/domain-service-error";

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
  /** Bodega por defecto persistida; si no hay, heurística (primera interna / primera). */
  bodegaInternaPrincipal: CuentaBodegaAsignada | null;
  /** Id persistido de bodega por defecto (null si aún no se eligió). */
  idBodegaDefault: string | null;
  /**
   * Acceso de la cuenta (`cuenta.esta_activa`).
   * false → los usuarios de la cuenta no pueden iniciar sesión.
   */
  estaActiva: boolean;
  /** La cuenta opera Polaria WMS. */
  accesoWms: boolean;
  /** La cuenta puede entrar a Mateo IA. */
  accesoMateo: boolean;
  /**
   * Tiene al menos un usuario con Auth (correo + clave → `usuario.id_auth`).
   */
  tieneCredenciales: boolean;
}

export interface CuentaBodegaDbRow {
  id_bodega: string;
  nombre: string;
  tipo: string;
  capacidad_slots: number | null;
  esta_activa: boolean;
}

export interface CuentaDbRow {
  codigo_cuenta: string;
  codigo_empresa: string;
  nombre_comercial: string;
  esta_activa: boolean;
  acceso_wms?: boolean;
  acceso_mateo?: boolean;
  id_bodega_default: string | null;
}

export const CUENTA_LIST_COLUMNS =
  "codigo_cuenta,codigo_empresa,nombre_comercial,esta_activa,acceso_wms,acceso_mateo,id_bodega_default";

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

function resolveBodegaPrincipal(
  bodegas: CuentaBodegaAsignada[],
  idBodegaDefault: string | null,
): CuentaBodegaAsignada | null {
  if (bodegas.length === 0) return null;
  if (idBodegaDefault) {
    const selected = bodegas.find((item) => item.idBodega === idBodegaDefault);
    if (selected) return selected;
  }
  const internas = bodegas
    .filter((item) => item.tipo === "interna")
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  if (internas[0]) return internas[0];
  return (
    [...bodegas].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))[0] ??
    null
  );
}

export function mapCuentaRow(
  row: CuentaDbRow,
  bodegas: CuentaBodegaDbRow[] = [],
  tieneCredenciales = false,
): CuentaListRow {
  const bodegasAsignadas = bodegas
    .filter((item) => item.esta_activa)
    .map(mapBodegaAsignada)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  const idBodegaDefault = row.id_bodega_default?.trim() || null;

  return {
    codigoCuenta: row.codigo_cuenta,
    codigoEmpresa: row.codigo_empresa,
    nombreComercial: row.nombre_comercial,
    bodegasAsignadas,
    idBodegaDefault,
    bodegaInternaPrincipal: resolveBodegaPrincipal(
      bodegasAsignadas,
      idBodegaDefault,
    ),
    estaActiva: row.esta_activa,
    accesoWms: row.acceso_wms !== false,
    accesoMateo: row.acceso_mateo !== false,
    tieneCredenciales,
  };
}

/** Cuentas con al menos un usuario ligado a Supabase Auth (correo/clave). */
export async function loadCuentasConCredencialesAuth(
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

export async function loadBodegasByCuenta(
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
export async function withEmpresaSchema<T>(
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
