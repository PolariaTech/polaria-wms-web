import {
  DEFAULT_LIST_LIMIT,
  requireCodigoCuenta,
  runDomainMutation,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/domain-service-error";

export interface BodegaInternaVinculadaRow {
  idBodega: string;
  nombre: string;
  codigo: string;
}

export interface BodegaInternaDisponibleRow {
  idBodega: string;
  nombre: string;
  codigo: string;
  codigoCuenta: string;
}

interface BodegaInternaDbRow {
  id_bodega: string;
  nombre: string;
  codigo: string;
  codigo_cuenta: string;
}

interface BodegaInternaCuentaDbRow {
  codigo_empresa: string;
}

interface BodegaInternaConCuentaDbRow extends BodegaInternaDbRow {
  cuenta: BodegaInternaCuentaDbRow | BodegaInternaCuentaDbRow[] | null;
}

const BODEGA_INTERNA_ADMIN_COLUMNS = "id_bodega,nombre,codigo,codigo_cuenta";

function mapBodegaInternaRow(row: BodegaInternaDbRow): BodegaInternaVinculadaRow {
  return {
    idBodega: row.id_bodega,
    nombre: row.nombre,
    codigo: row.codigo,
  };
}

function mapBodegaDisponibleRow(row: BodegaInternaDbRow): BodegaInternaDisponibleRow {
  return {
    idBodega: row.id_bodega,
    nombre: row.nombre,
    codigo: row.codigo,
    codigoCuenta: row.codigo_cuenta,
  };
}

function resolveCuentaEmpresa(
  cuenta: BodegaInternaConCuentaDbRow["cuenta"],
): string | null {
  if (!cuenta) return null;
  if (Array.isArray(cuenta)) {
    return cuenta[0]?.codigo_empresa ?? null;
  }
  return cuenta.codigo_empresa ?? null;
}

export function formatBodegaInternaId(idBodega: string): string {
  return idBodega.slice(0, 8);
}

export interface ListBodegasInternasVinculadasParams {
  codigoCuenta: string;
  limit?: number;
}

/** Bodegas internas activas vinculadas a la cuenta tenant. */
export async function listBodegasInternasVinculadasAdmin(
  params: ListBodegasInternasVinculadasParams,
): Promise<BodegaInternaVinculadaRow[]> {
  const codigoCuenta = requireCodigoCuenta(params.codigoCuenta);
  const limit = params.limit ?? DEFAULT_LIST_LIMIT;

  const rows = await runDomainQuery<BodegaInternaDbRow[]>((client) => {
    const query = client
      .from("bodega")
      .select(BODEGA_INTERNA_ADMIN_COLUMNS)
      .eq("codigo_cuenta", codigoCuenta)
      .eq("tipo", "interna")
      .eq("esta_activa", true)
      .order("nombre", { ascending: true })
      .limit(limit);

    return query as unknown as Promise<{
      data: BodegaInternaDbRow[] | null;
      error: { message: string } | null;
    }>;
  });

  return rows.map(mapBodegaInternaRow);
}

export interface ListBodegasInternasDisponiblesParams {
  codigoCuenta: string;
  codigoEmpresa: string;
  limit?: number;
}

/** Bodegas internas activas de la empresa que aún no están en la cuenta. */
export async function listBodegasInternasDisponiblesAdmin(
  params: ListBodegasInternasDisponiblesParams,
): Promise<BodegaInternaDisponibleRow[]> {
  const codigoCuenta = requireCodigoCuenta(params.codigoCuenta);
  const codigoEmpresa = params.codigoEmpresa.trim();
  const limit = params.limit ?? DEFAULT_LIST_LIMIT;

  if (!codigoEmpresa) {
    throw new DomainServiceError(
      "No se encontró la empresa activa.",
      "INVALID_ARGUMENT",
    );
  }

  const rows = await runDomainQuery<BodegaInternaDbRow[]>((client) => {
    const query = client
      .from("bodega")
      .select(`${BODEGA_INTERNA_ADMIN_COLUMNS},cuenta!inner(codigo_empresa)`)
      .eq("tipo", "interna")
      .eq("esta_activa", true)
      .eq("cuenta.codigo_empresa", codigoEmpresa)
      .neq("codigo_cuenta", codigoCuenta)
      .order("nombre", { ascending: true })
      .limit(limit);

    return query as unknown as Promise<{
      data: BodegaInternaDbRow[] | null;
      error: { message: string } | null;
    }>;
  });

  return rows.map(mapBodegaDisponibleRow);
}

export interface VincularBodegaInternaInput {
  codigoCuenta: string;
  codigoEmpresa: string;
  idBodega: string;
}

/** Vincula una bodega interna de la empresa a la cuenta tenant. */
export async function vincularBodegaInternaAdmin(
  input: VincularBodegaInternaInput,
): Promise<BodegaInternaVinculadaRow> {
  const codigoCuenta = requireCodigoCuenta(input.codigoCuenta);
  const codigoEmpresa = input.codigoEmpresa.trim();
  const idBodega = input.idBodega.trim();

  if (!codigoEmpresa) {
    throw new DomainServiceError(
      "No se encontró la empresa activa.",
      "INVALID_ARGUMENT",
    );
  }
  if (!idBodega) {
    throw new DomainServiceError(
      "Selecciona una bodega para vincular.",
      "INVALID_ARGUMENT",
    );
  }

  const bodega = await runDomainQuery<BodegaInternaConCuentaDbRow | null>(
    (client) => {
      const query = client
        .from("bodega")
        .select(`${BODEGA_INTERNA_ADMIN_COLUMNS},cuenta(codigo_empresa)`)
        .eq("id_bodega", idBodega)
        .eq("tipo", "interna")
        .eq("esta_activa", true)
        .maybeSingle();

      return query as unknown as Promise<{
        data: BodegaInternaConCuentaDbRow | null;
        error: { message: string } | null;
      }>;
    },
  );

  if (!bodega) {
    throw new DomainServiceError(
      "La bodega seleccionada no está disponible.",
      "INVALID_ARGUMENT",
    );
  }

  const empresaBodega = resolveCuentaEmpresa(bodega.cuenta);
  if (empresaBodega !== codigoEmpresa) {
    throw new DomainServiceError(
      "La bodega no pertenece a tu empresa.",
      "INVALID_ARGUMENT",
    );
  }

  if (bodega.codigo_cuenta === codigoCuenta) {
    throw new DomainServiceError(
      "La bodega ya está vinculada a tu cuenta.",
      "INVALID_ARGUMENT",
    );
  }

  await runDomainMutation((client) => {
    const query = client
      .from("bodega")
      .update({ codigo_cuenta: codigoCuenta })
      .eq("id_bodega", idBodega);

    return query as unknown as Promise<{
      data: unknown;
      error: { message: string } | null;
    }>;
  });

  return mapBodegaInternaRow(bodega);
}
