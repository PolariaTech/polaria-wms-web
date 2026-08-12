import {
  findCuentaAcrossSchemas,
  listBodegasAcrossSchemas,
  resolveNombresCuentaAcrossSchemas,
} from "@/lib/supabase/tenant-fanout";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { generateCodigoCuentaFromNombre } from "@/lib/utils/generate-codigo-cuenta";
import { TENANT_HEADER_NAMES } from "@/lib/utils/tenant-headers";
import { ApiError, apiRequest } from "@/services/api/api";

export interface BodegaInternaListRow {
  idBodega: string;
  nombre: string;
  capacidad: number | null;
  bodegaAsignada: string;
}

export interface CreateBodegaInternaInput {
  nombre: string;
  capacidad: number;
  codigoCuenta: string;
  idCreador?: string | null;
}

async function resolveCuentaAsignada(codigoCuenta: string): Promise<{
  codigoCuenta: string;
  codigoEmpresa: string;
  nombreComercial: string;
}> {
  const cuenta = await findCuentaAcrossSchemas(codigoCuenta);
  if (!cuenta?.codigo_cuenta || !cuenta.codigo_empresa) {
    throw new DomainServiceError(
      "La cuenta seleccionada no es válida.",
      "INVALID_ARGUMENT",
    );
  }

  return {
    codigoCuenta: cuenta.codigo_cuenta,
    codigoEmpresa: cuenta.codigo_empresa,
    nombreComercial: cuenta.nombre_comercial,
  };
}

/**
 * Inicializa el layout operativo de la bodega vía API Nest.
 * Si falla, la bodega ya persistida NO se revierte (sin rollback).
 */
async function bootstrapBodegaLayout(params: {
  idBodega: string;
  codigoEmpresa: string;
  codigoCuenta: string;
}): Promise<void> {
  try {
    await apiRequest<void>(
      `/configuracion/bodegas/${encodeURIComponent(params.idBodega)}/bootstrap-layout`,
      {
        method: "POST",
        auth: true,
        headers: {
          [TENANT_HEADER_NAMES.codigoEmpresa]: params.codigoEmpresa,
          [TENANT_HEADER_NAMES.codigoCuenta]: params.codigoCuenta,
          [TENANT_HEADER_NAMES.idBodega]: params.idBodega,
        },
      },
    );
  } catch (error) {
    const detail =
      error instanceof ApiError
        ? error.message
        : "Error desconocido al inicializar el layout.";
    throw new DomainServiceError(
      `La bodega se creó, pero no se pudo inicializar el layout: ${detail}`,
      "MUTATION_FAILED",
      error,
    );
  }
}

/** Lista bodegas internas activas (public + emp_*). */
export async function listBodegasInternasConfigurator(): Promise<
  BodegaInternaListRow[]
> {
  const rows = await listBodegasAcrossSchemas({ tipo: "interna" });
  const nombres = await resolveNombresCuentaAcrossSchemas([
    ...new Set(rows.map((row) => row.codigo_cuenta).filter(Boolean)),
  ]);

  return rows.map((row) => ({
    idBodega: row.id_bodega,
    nombre: row.nombre,
    capacidad: row.capacidad_slots,
    bodegaAsignada: nombres.get(row.codigo_cuenta) ?? row.codigo_cuenta ?? "—",
  }));
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

  const { codigoCuenta, codigoEmpresa, nombreComercial } =
    await resolveCuentaAsignada(input.codigoCuenta);

  let created: {
    idBodega: string;
    capacidadSlots: number | null;
  };
  try {
    created = await apiRequest<{
      idBodega: string;
      capacidadSlots: number | null;
    }>("/configuracion/bodegas", {
      method: "POST",
      auth: true,
      headers: {
        [TENANT_HEADER_NAMES.codigoEmpresa]: codigoEmpresa,
        [TENANT_HEADER_NAMES.codigoCuenta]: codigoCuenta,
      },
      body: {
        codigoCuenta,
        codigo,
        nombre,
        tipo: "interna",
        capacidadSlots: Math.trunc(input.capacidad),
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw new DomainServiceError(error.message, "MUTATION_FAILED", error);
    }
    throw error;
  }

  const idBodega = created.idBodega;

  await bootstrapBodegaLayout({
    idBodega,
    codigoEmpresa,
    codigoCuenta,
  });

  return {
    idBodega,
    nombre,
    capacidad: Math.trunc(input.capacidad),
    bodegaAsignada: nombreComercial,
  };
}
