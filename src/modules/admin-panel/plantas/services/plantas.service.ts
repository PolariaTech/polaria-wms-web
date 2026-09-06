import {
  DEFAULT_LIST_LIMIT,
  requireCodigoCuenta,
  runDomainMutation,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import {
  generateCodigoCuentaFromNombre,
  normalizeCodigoCuentaInput,
} from "@/lib/utils/generate-codigo-cuenta";

export interface PlantaListRow {
  idPlanta: string;
  codigo: string;
  nombre: string;
  direccion: string;
  capacidadPallets: number | null;
  rangoTemperatura: string | null;
  estaActivo: boolean;
}

interface PlantaDbRow {
  id_planta: string;
  codigo: string;
  nombre: string;
  direccion: string;
  capacidad_pallets: number | null;
  rango_temperatura: string | null;
  esta_activo?: boolean | null;
}

const PLANTA_LIST_COLUMNS =
  "id_planta,codigo,nombre,direccion,capacidad_pallets,rango_temperatura,esta_activo";

function mapPlantaRow(row: PlantaDbRow): PlantaListRow {
  return {
    idPlanta: row.id_planta,
    codigo: row.codigo,
    nombre: row.nombre,
    direccion: row.direccion,
    capacidadPallets: row.capacidad_pallets,
    rangoTemperatura: row.rango_temperatura,
    estaActivo: row.esta_activo !== false,
  };
}

export function formatPlantaId(idPlanta: string): string {
  return idPlanta.slice(0, 8).toUpperCase();
}

export interface ListPlantasParams {
  codigoCuenta: string;
  limit?: number;
  /** true (default) solo activas; false incluye deshabilitadas (tablas admin). */
  soloActivos?: boolean;
}

/** Lista plantas de la cuenta (scope tenant). */
export async function listPlantasAdmin(
  params: ListPlantasParams,
): Promise<PlantaListRow[]> {
  const codigoCuenta = requireCodigoCuenta(params.codigoCuenta);
  const limit = params.limit ?? DEFAULT_LIST_LIMIT;
  const soloActivos = params.soloActivos !== false;

  const rows = await runDomainQuery<PlantaDbRow[]>((client) => {
    let query = client
      .from("planta")
      .select(PLANTA_LIST_COLUMNS)
      .eq("codigo_cuenta", codigoCuenta);

    if (soloActivos) {
      query = query.eq("esta_activo", true);
    }

    const finalQuery = query.order("nombre", { ascending: true }).limit(limit);

    return finalQuery as unknown as Promise<{
      data: PlantaDbRow[] | null;
      error: { message: string } | null;
    }>;
  });

  return rows.map(mapPlantaRow);
}

export interface CreatePlantaInput {
  codigoCuenta: string;
  nombre: string;
  direccion: string;
  capacidadPallets?: number | null;
  rangoTemperatura?: string | null;
}

function parseOptionalPositiveInteger(
  value: number | null | undefined,
  label: string,
): number | null {
  if (value === null || value === undefined) return null;
  if (!Number.isInteger(value) || value <= 0) {
    throw new DomainServiceError(
      `${label} debe ser un entero mayor a cero.`,
      "INVALID_ARGUMENT",
    );
  }

  return value;
}

/** Crea una planta para la cuenta activa (scope tenant). */
export async function createPlantaAdmin(
  input: CreatePlantaInput,
): Promise<PlantaListRow> {
  const codigoCuenta = requireCodigoCuenta(input.codigoCuenta);
  const nombre = input.nombre.trim();
  const direccion = input.direccion.trim();
  const rangoTemperatura = input.rangoTemperatura?.trim() ?? "";
  const codigo = normalizeCodigoCuentaInput(
    generateCodigoCuentaFromNombre(nombre),
  );

  if (!nombre) {
    throw new DomainServiceError(
      "El nombre de la planta es obligatorio.",
      "INVALID_ARGUMENT",
    );
  }

  if (!direccion) {
    throw new DomainServiceError(
      "La dirección de la planta es obligatoria.",
      "INVALID_ARGUMENT",
    );
  }

  if (!codigo) {
    throw new DomainServiceError(
      "No se pudo generar el código de la planta.",
      "INVALID_ARGUMENT",
    );
  }

  const capacidadPallets = parseOptionalPositiveInteger(
    input.capacidadPallets,
    "La capacidad de pallets",
  );

  const inserted = await runDomainMutation<PlantaDbRow | null>((client) => {
    const query = client
      .from("planta")
      .insert({
        codigo_cuenta: codigoCuenta,
        codigo,
        nombre,
        direccion,
        capacidad_pallets: capacidadPallets,
        rango_temperatura: rangoTemperatura || null,
        esta_activo: true,
      })
      .select(PLANTA_LIST_COLUMNS)
      .single();

    return query as unknown as Promise<{
      data: PlantaDbRow | null;
      error: { message: string } | null;
    }>;
  });

  if (!inserted) {
    throw new DomainServiceError(
      "No se pudo crear la planta.",
      "MUTATION_FAILED",
    );
  }

  return mapPlantaRow(inserted);
}

export interface UpdatePlantaInput {
  codigoCuenta: string;
  idPlanta: string;
  nombre: string;
  direccion: string;
  capacidadPallets?: number | null;
  rangoTemperatura?: string | null;
}

/** Actualiza una planta de la cuenta activa (scope tenant). */
export async function updatePlantaAdmin(
  input: UpdatePlantaInput,
): Promise<PlantaListRow> {
  const codigoCuenta = requireCodigoCuenta(input.codigoCuenta);
  const idPlanta = input.idPlanta.trim();
  const nombre = input.nombre.trim();
  const direccion = input.direccion.trim();
  const rangoTemperatura = input.rangoTemperatura?.trim() ?? "";

  if (!idPlanta) {
    throw new DomainServiceError(
      "Falta el identificador de la planta.",
      "INVALID_ARGUMENT",
    );
  }

  if (!nombre) {
    throw new DomainServiceError(
      "El nombre de la planta es obligatorio.",
      "INVALID_ARGUMENT",
    );
  }

  if (!direccion) {
    throw new DomainServiceError(
      "La dirección de la planta es obligatoria.",
      "INVALID_ARGUMENT",
    );
  }

  const capacidadPallets = parseOptionalPositiveInteger(
    input.capacidadPallets,
    "La capacidad de pallets",
  );

  const updated = await runDomainMutation<PlantaDbRow | null>((client) => {
    const query = client
      .from("planta")
      .update({
        nombre,
        direccion,
        capacidad_pallets: capacidadPallets,
        rango_temperatura: rangoTemperatura || null,
      })
      .eq("id_planta", idPlanta)
      .eq("codigo_cuenta", codigoCuenta)
      .select(PLANTA_LIST_COLUMNS)
      .single();

    return query as unknown as Promise<{
      data: PlantaDbRow | null;
      error: { message: string } | null;
    }>;
  });

  if (!updated) {
    throw new DomainServiceError(
      "No se pudo actualizar la planta.",
      "MUTATION_FAILED",
    );
  }

  return mapPlantaRow(updated);
}

export interface DeactivatePlantaParams {
  codigoCuenta: string;
  idPlanta: string;
}

/** Deshabilita una planta (baja lógica). */
export async function deactivatePlantaAdmin(
  params: DeactivatePlantaParams,
): Promise<void> {
  const codigoCuenta = requireCodigoCuenta(params.codigoCuenta);
  const idPlanta = params.idPlanta.trim();

  if (!idPlanta) {
    throw new DomainServiceError(
      "Falta el identificador de la planta.",
      "INVALID_ARGUMENT",
    );
  }

  await runDomainMutation((client) => {
    const query = client
      .from("planta")
      .update({ esta_activo: false })
      .eq("codigo_cuenta", codigoCuenta)
      .eq("id_planta", idPlanta);

    return query as unknown as Promise<{
      data: unknown;
      error: { message: string } | null;
    }>;
  });
}

/** Reactiva una planta deshabilitada. */
export async function activatePlantaAdmin(
  params: DeactivatePlantaParams,
): Promise<void> {
  const codigoCuenta = requireCodigoCuenta(params.codigoCuenta);
  const idPlanta = params.idPlanta.trim();

  if (!idPlanta) {
    throw new DomainServiceError(
      "Falta el identificador de la planta.",
      "INVALID_ARGUMENT",
    );
  }

  await runDomainMutation((client) => {
    const query = client
      .from("planta")
      .update({ esta_activo: true })
      .eq("codigo_cuenta", codigoCuenta)
      .eq("id_planta", idPlanta);

    return query as unknown as Promise<{
      data: unknown;
      error: { message: string } | null;
    }>;
  });
}
