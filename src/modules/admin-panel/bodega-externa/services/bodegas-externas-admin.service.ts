import {
  DEFAULT_LIST_LIMIT,
  requireCodigoCuenta,
  runDomainMutation,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/utils/domain-service-error";

export interface BodegaExternaVinculadaRow {
  idBodega: string;
  nombre: string;
  codigo: string;
}

export interface BodegaExternaDisponibleRow {
  idBodega: string;
  nombre: string;
  codigo: string;
  codigoCuenta: string;
}

interface BodegaExternaDbRow {
  id_bodega: string;
  nombre: string;
  codigo: string;
  codigo_cuenta: string;
}

interface BodegaExternaCuentaDbRow {
  codigo_empresa: string;
}

interface BodegaExternaConCuentaDbRow extends BodegaExternaDbRow {
  cuenta: BodegaExternaCuentaDbRow | BodegaExternaCuentaDbRow[] | null;
}

const BODEGA_EXTERNA_ADMIN_COLUMNS = "id_bodega,nombre,codigo,codigo_cuenta";

function mapBodegaExternaRow(row: BodegaExternaDbRow): BodegaExternaVinculadaRow {
  return {
    idBodega: row.id_bodega,
    nombre: row.nombre,
    codigo: row.codigo,
  };
}

function mapBodegaDisponibleRow(row: BodegaExternaDbRow): BodegaExternaDisponibleRow {
  return {
    idBodega: row.id_bodega,
    nombre: row.nombre,
    codigo: row.codigo,
    codigoCuenta: row.codigo_cuenta,
  };
}

function resolveCuentaEmpresa(
  cuenta: BodegaExternaConCuentaDbRow["cuenta"],
): string | null {
  if (!cuenta) return null;
  if (Array.isArray(cuenta)) {
    return cuenta[0]?.codigo_empresa ?? null;
  }
  return cuenta.codigo_empresa ?? null;
}

export function formatBodegaExternaId(idBodega: string): string {
  return idBodega.slice(0, 8);
}

export interface ListBodegasExternasVinculadasParams {
  codigoCuenta: string;
  limit?: number;
}

/** Bodegas externas activas vinculadas a la cuenta tenant. */
export async function listBodegasExternasVinculadasAdmin(
  params: ListBodegasExternasVinculadasParams,
): Promise<BodegaExternaVinculadaRow[]> {
  const codigoCuenta = requireCodigoCuenta(params.codigoCuenta);
  const limit = params.limit ?? DEFAULT_LIST_LIMIT;

  const rows = await runDomainQuery<BodegaExternaDbRow[]>((client) => {
    const query = client
      .from("bodega")
      .select(BODEGA_EXTERNA_ADMIN_COLUMNS)
      .eq("codigo_cuenta", codigoCuenta)
      .eq("tipo", "externa")
      .eq("esta_activa", true)
      .order("nombre", { ascending: true })
      .limit(limit);

    return query as unknown as Promise<{
      data: BodegaExternaDbRow[] | null;
      error: { message: string } | null;
    }>;
  });

  return rows.map(mapBodegaExternaRow);
}

export interface ListBodegasExternasDisponiblesParams {
  codigoCuenta: string;
  codigoEmpresa: string;
  limit?: number;
}

/** Bodegas externas activas de la empresa que aún no están en la cuenta. */
export async function listBodegasExternasDisponiblesAdmin(
  params: ListBodegasExternasDisponiblesParams,
): Promise<BodegaExternaDisponibleRow[]> {
  const codigoCuenta = requireCodigoCuenta(params.codigoCuenta);
  const codigoEmpresa = params.codigoEmpresa.trim();
  const limit = params.limit ?? DEFAULT_LIST_LIMIT;

  if (!codigoEmpresa) {
    throw new DomainServiceError(
      "No se encontró la empresa activa.",
      "INVALID_ARGUMENT",
    );
  }

  const rows = await runDomainQuery<BodegaExternaDbRow[]>((client) => {
    const query = client
      .from("bodega")
      .select(`${BODEGA_EXTERNA_ADMIN_COLUMNS},cuenta!inner(codigo_empresa)`)
      .eq("tipo", "externa")
      .eq("esta_activa", true)
      .eq("cuenta.codigo_empresa", codigoEmpresa)
      .neq("codigo_cuenta", codigoCuenta)
      .order("nombre", { ascending: true })
      .limit(limit);

    return query as unknown as Promise<{
      data: BodegaExternaDbRow[] | null;
      error: { message: string } | null;
    }>;
  });

  return rows.map(mapBodegaDisponibleRow);
}

export interface VincularBodegaExternaInput {
  codigoCuenta: string;
  codigoEmpresa: string;
  idBodega: string;
}

/** Vincula una bodega externa de la empresa a la cuenta tenant. */
export async function vincularBodegaExternaAdmin(
  input: VincularBodegaExternaInput,
): Promise<BodegaExternaVinculadaRow> {
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

  const bodega = await runDomainQuery<BodegaExternaConCuentaDbRow | null>(
    (client) => {
      const query = client
        .from("bodega")
        .select(`${BODEGA_EXTERNA_ADMIN_COLUMNS},cuenta(codigo_empresa)`)
        .eq("id_bodega", idBodega)
        .eq("tipo", "externa")
        .eq("esta_activa", true)
        .maybeSingle();

      return query as unknown as Promise<{
        data: BodegaExternaConCuentaDbRow | null;
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

  return mapBodegaExternaRow(bodega);
}
