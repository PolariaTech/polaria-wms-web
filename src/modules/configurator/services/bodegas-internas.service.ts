import {
  DEFAULT_LIST_LIMIT,
  runDomainMutation,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/domain-service-error";
import { generateCodigoCuentaFromNombre } from "@/lib/generate-codigo-cuenta";

export interface BodegaInternaListRow {
  idBodega: string;
  nombre: string;
  capacidad: number | null;
  bodegaAsignada: string;
}

interface BodegaInternaCuentaDbRow {
  nombre_comercial: string;
}

interface BodegaInternaDbRow {
  id_bodega: string;
  nombre: string;
  capacidad_slots: number | null;
  cuenta: BodegaInternaCuentaDbRow | BodegaInternaCuentaDbRow[] | null;
}

const BODEGA_INTERNA_LIST_COLUMNS =
  "id_bodega,nombre,capacidad_slots,cuenta(nombre_comercial)";

function resolveCuentaNombre(
  cuenta: BodegaInternaDbRow["cuenta"],
): string {
  if (!cuenta) return "—";
  if (Array.isArray(cuenta)) {
    return cuenta[0]?.nombre_comercial ?? "—";
  }
  return cuenta.nombre_comercial ?? "—";
}

function mapBodegaInternaRow(row: BodegaInternaDbRow): BodegaInternaListRow {
  return {
    idBodega: row.id_bodega,
    nombre: row.nombre,
    capacidad: row.capacidad_slots,
    bodegaAsignada: resolveCuentaNombre(row.cuenta),
  };
}

async function resolveDefaultCodigoCuenta(): Promise<{
  codigoCuenta: string;
  nombreComercial: string;
}> {
  const rows = await runDomainQuery<
    { codigo_cuenta: string; nombre_comercial: string }[]
  >((client) => {
    const query = client
      .from("cuenta")
      .select("codigo_cuenta,nombre_comercial")
      .eq("esta_activa", true)
      .order("nombre_comercial", { ascending: true })
      .limit(1);

    return query as unknown as Promise<{
      data: { codigo_cuenta: string; nombre_comercial: string }[] | null;
      error: { message: string } | null;
    }>;
  });

  const cuenta = rows[0];
  if (!cuenta?.codigo_cuenta) {
    throw new DomainServiceError(
      "No hay cuentas activas para asociar la bodega.",
      "INVALID_ARGUMENT",
    );
  }

  return {
    codigoCuenta: cuenta.codigo_cuenta,
    nombreComercial: cuenta.nombre_comercial,
  };
}

/** Lista bodegas internas activas para el configurador (scope platform). */
export async function listBodegasInternasConfigurator(): Promise<
  BodegaInternaListRow[]
> {
  const rows = await runDomainQuery<BodegaInternaDbRow[]>((client) => {
    const query = client
      .from("bodega")
      .select(BODEGA_INTERNA_LIST_COLUMNS)
      .eq("tipo", "interna")
      .eq("esta_activa", true)
      .order("nombre", { ascending: true })
      .limit(DEFAULT_LIST_LIMIT);

    return query as unknown as Promise<{
      data: BodegaInternaDbRow[] | null;
      error: { message: string } | null;
    }>;
  });

  return rows.map(mapBodegaInternaRow);
}

export interface CreateBodegaInternaInput {
  nombre: string;
  capacidad: number;
  idCreador?: string | null;
}

/** Crea una bodega interna desde el configurador (scope platform). */
export async function createBodegaInternaConfigurator(
  input: CreateBodegaInternaInput,
): Promise<BodegaInternaListRow> {
  const nombre = input.nombre.trim();
  const codigo = generateCodigoCuentaFromNombre(nombre);

  if (!nombre) {
    throw new DomainServiceError(
      "El nombre de la bodega es obligatorio.",
      "INVALID_ARGUMENT",
    );
  }

  if (!Number.isFinite(input.capacidad) || input.capacidad <= 0) {
    throw new DomainServiceError(
      "La capacidad debe ser un número mayor a cero.",
      "INVALID_ARGUMENT",
    );
  }

  if (!codigo) {
    throw new DomainServiceError(
      "No se pudo generar el código de la bodega.",
      "INVALID_ARGUMENT",
    );
  }

  const { codigoCuenta, nombreComercial } = await resolveDefaultCodigoCuenta();

  const inserted = await runDomainMutation<{ id_bodega: string }>((client) => {
    const query = client
      .from("bodega")
      .insert({
        codigo_cuenta: codigoCuenta,
        codigo,
        nombre,
        tipo: "interna",
        capacidad_slots: Math.trunc(input.capacidad),
        id_creador: input.idCreador ?? null,
        esta_activa: true,
      })
      .select("id_bodega")
      .single();

    return query as unknown as Promise<{
      data: { id_bodega: string } | null;
      error: { message: string } | null;
    }>;
  });

  return {
    idBodega: inserted.id_bodega,
    nombre,
    capacidad: Math.trunc(input.capacidad),
    bodegaAsignada: nombreComercial,
  };
}
