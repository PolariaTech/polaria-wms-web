import {
  DEFAULT_LIST_LIMIT,
  runDomainMutation,
  runDomainQuery,
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
   * Acceso / credenciales de la cuenta (`cuenta.esta_activa`).
   * false → los usuarios de la cuenta no pueden iniciar sesión.
   */
  estaActiva: boolean;
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
  bodega: CuentaBodegaDbRow[] | null;
}

/**
 * PostgREST: cuenta↔usuario tiene dos FK (id_creador y usuario.codigo_cuenta).
 * Hay que nombrar la relación explícita para los usuarios de la cuenta.
 */
const CUENTA_LIST_COLUMNS =
  "codigo_cuenta,codigo_empresa,nombre_comercial,esta_activa,bodega(id_bodega,nombre,tipo,capacidad_slots,esta_activa)";

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
  return [...bodegas].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))[0] ?? null;
}

function mapCuentaRow(row: CuentaDbRow): CuentaListRow {
  const bodegasAsignadas = (row.bodega ?? [])
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
  };
}

/** Lista cuentas comerciales para el configurador (scope platform). */
export async function listCuentasConfigurator(): Promise<CuentaListRow[]> {
  const rows = await runDomainQuery<CuentaDbRow[]>((client) => {
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

  return rows.map(mapCuentaRow);
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

  return {
    codigoCuenta,
    codigoEmpresa,
    nombreComercial,
    bodegasAsignadas: [],
    bodegaInternaPrincipal: null,
    estaActiva: true,
  };
}

export interface UpdateCuentaInput {
  codigoCuenta: string;
  nombreComercial: string;
  /** Credenciales / acceso: false bloquea login de usuarios de la cuenta. */
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
