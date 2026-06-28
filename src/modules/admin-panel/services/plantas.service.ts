import {
  DEFAULT_LIST_LIMIT,
  requireCodigoCuenta,
  runDomainMutation,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/domain-service-error";
import {
  generateCodigoCuentaFromNombre,
  normalizeCodigoCuentaInput,
} from "@/lib/generate-codigo-cuenta";

export interface PlantaListRow {
  idPlanta: string;
  codigo: string;
  nombre: string;
  direccion: string;
  capacidadPallets: number | null;
  rangoTemperatura: string | null;
}

interface PlantaDbRow {
  id_planta: string;
  codigo: string;
  nombre: string;
  direccion: string;
  capacidad_pallets: number | null;
  rango_temperatura: string | null;
}

const PLANTA_LIST_COLUMNS =
  "id_planta,codigo,nombre,direccion,capacidad_pallets,rango_temperatura";

function mapPlantaRow(row: PlantaDbRow): PlantaListRow {
  return {
    idPlanta: row.id_planta,
    codigo: row.codigo,
    nombre: row.nombre,
    direccion: row.direccion,
    capacidadPallets: row.capacidad_pallets,
    rangoTemperatura: row.rango_temperatura,
  };
}

export function formatPlantaId(idPlanta: string): string {
  return idPlanta.slice(0, 8).toUpperCase();
}

export interface ListPlantasParams {
  codigoCuenta: string;
  limit?: number;
}

/** Lista plantas activas de la cuenta (scope tenant). */
export async function listPlantasAdmin(
  params: ListPlantasParams,
): Promise<PlantaListRow[]> {
  const codigoCuenta = requireCodigoCuenta(params.codigoCuenta);
  const limit = params.limit ?? DEFAULT_LIST_LIMIT;

  const rows = await runDomainQuery<PlantaDbRow[]>((client) => {
    const query = client
      .from("planta")
      .select(PLANTA_LIST_COLUMNS)
      .eq("codigo_cuenta", codigoCuenta)
      .eq("esta_activo", true)
      .order("nombre", { ascending: true })
      .limit(limit);

    return query as unknown as Promise<{
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
