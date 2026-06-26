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
import type { CamionTipo } from "../constants/camion-types";

export interface CamionListRow {
  idCamion: string;
  codigo: string;
  placa: string;
  marca: string | null;
  modelo: string | null;
  tipo: CamionTipo | string;
  capacidadKg: number | null;
  capacidadM3: number | null;
  capacidadPallets: number | null;
  rangoTemperatura: string | null;
  disponible: boolean;
  createdAt: string;
}

interface CamionDbRow {
  id_camion: string;
  codigo: string | null;
  placa: string;
  marca: string | null;
  modelo: string | null;
  capacidad_kg: string | number | null;
  capacidad_m3: string | number | null;
  capacidad_pallets: number | null;
  tipo: CamionTipo | string;
  rango_temperatura: string | null;
  disponible: boolean;
  created_at: string;
}

const CAMION_LIST_COLUMNS =
  "id_camion,codigo,placa,marca,modelo,capacidad_kg,capacidad_m3,capacidad_pallets,tipo,rango_temperatura,disponible,created_at";

function parseDecimal(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapCamionRow(row: CamionDbRow): CamionListRow {
  return {
    idCamion: row.id_camion,
    codigo: row.codigo ?? "—",
    placa: row.placa,
    marca: row.marca,
    modelo: row.modelo,
    tipo: row.tipo,
    capacidadKg: parseDecimal(row.capacidad_kg),
    capacidadM3: parseDecimal(row.capacidad_m3),
    capacidadPallets: row.capacidad_pallets,
    rangoTemperatura: row.rango_temperatura,
    disponible: row.disponible,
    createdAt: row.created_at,
  };
}

export function formatCamionId(idCamion: string): string {
  return idCamion.slice(0, 8).toUpperCase();
}

export interface ListCamionesParams {
  codigoCuenta: string;
  limit?: number;
}

/** Lista camiones activos de la cuenta (scope tenant). */
export async function listCamionesAdmin(
  params: ListCamionesParams,
): Promise<CamionListRow[]> {
  const codigoCuenta = requireCodigoCuenta(params.codigoCuenta);
  const limit = params.limit ?? DEFAULT_LIST_LIMIT;

  const rows = await runDomainQuery<CamionDbRow[]>((client) => {
    const query = client
      .from("camion")
      .select(CAMION_LIST_COLUMNS)
      .eq("codigo_cuenta", codigoCuenta)
      .eq("esta_activo", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    return query as unknown as Promise<{
      data: CamionDbRow[] | null;
      error: { message: string } | null;
    }>;
  });

  return rows.map(mapCamionRow);
}

export interface CreateCamionInput {
  codigoCuenta: string;
  placa: string;
  marca?: string | null;
  modelo?: string | null;
  capacidadKg?: number | null;
  capacidadM3?: number | null;
  capacidadPallets?: number | null;
  tipo: CamionTipo;
  rangoTemperatura?: string | null;
}

function parseOptionalPositiveNumber(
  value: number | null | undefined,
  label: string,
): number | null {
  if (value === null || value === undefined) return null;
  if (!Number.isFinite(value) || value <= 0) {
    throw new DomainServiceError(
      `${label} debe ser un número mayor a cero.`,
      "INVALID_ARGUMENT",
    );
  }

  return value;
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

/** Crea un camión para la cuenta activa (scope tenant). */
export async function createCamionAdmin(
  input: CreateCamionInput,
): Promise<CamionListRow> {
  const codigoCuenta = requireCodigoCuenta(input.codigoCuenta);
  const placa = input.placa.trim().toUpperCase();
  const marca = input.marca?.trim() ?? "";
  const modelo = input.modelo?.trim() ?? "";
  const rangoTemperatura = input.rangoTemperatura?.trim() ?? "";
  const codigo = normalizeCodigoCuentaInput(
    generateCodigoCuentaFromNombre(placa),
  );

  if (!placa) {
    throw new DomainServiceError("La placa es obligatoria.", "INVALID_ARGUMENT");
  }

  if (!codigo) {
    throw new DomainServiceError(
      "No se pudo generar el código del camión.",
      "INVALID_ARGUMENT",
    );
  }

  const capacidadKg = parseOptionalPositiveNumber(
    input.capacidadKg,
    "El peso máximo",
  );
  const capacidadM3 = parseOptionalPositiveNumber(
    input.capacidadM3,
    "El volumen",
  );
  const capacidadPallets = parseOptionalPositiveInteger(
    input.capacidadPallets,
    "La capacidad de pallets",
  );

  const inserted = await runDomainMutation<CamionDbRow | null>((client) => {
    const query = client
      .from("camion")
      .insert({
        codigo_cuenta: codigoCuenta,
        codigo,
        placa,
        marca: marca || null,
        modelo: modelo || null,
        capacidad_kg: capacidadKg,
        capacidad_m3: capacidadM3,
        capacidad_pallets: capacidadPallets,
        tipo: input.tipo,
        rango_temperatura: rangoTemperatura || null,
        disponible: true,
        esta_activo: true,
      })
      .select(CAMION_LIST_COLUMNS)
      .single();

    return query as unknown as Promise<{
      data: CamionDbRow | null;
      error: { message: string } | null;
    }>;
  });

  if (!inserted) {
    throw new DomainServiceError(
      "No se pudo crear el camión.",
      "MUTATION_FAILED",
    );
  }

  return mapCamionRow(inserted);
}
