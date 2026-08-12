import {
  findCuentaAcrossSchemas,
  listBodegasAcrossSchemas,
  resolveNombresCuentaAcrossSchemas,
} from "@/lib/supabase/tenant-fanout";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { generateCodigoCuentaFromNombre } from "@/lib/utils/generate-codigo-cuenta";
import { TENANT_HEADER_NAMES } from "@/lib/utils/tenant-headers";
import { apiRequest } from "@/services/api/api";

export interface BodegaExternaListRow {
  idBodega: string;
  nombre: string;
  capacidad: number | null;
  bodegaAsignada: string;
}

export interface CreateBodegaExternaInput {
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

/** Lista bodegas externas activas (public + emp_*). */
export async function listBodegasExternasConfigurator(): Promise<
  BodegaExternaListRow[]
> {
  const rows = await listBodegasAcrossSchemas({ tipo: "externa" });
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

/** Crea una bodega externa desde el configurador (scope platform). */
export async function createBodegaExternaConfigurator(
  input: CreateBodegaExternaInput,
): Promise<BodegaExternaListRow> {
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

  const created = await apiRequest<{
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
      tipo: "externa",
      capacidadSlots: Math.trunc(input.capacidad),
    },
  });

  return {
    idBodega: created.idBodega,
    nombre,
    capacidad: Math.trunc(input.capacidad),
    bodegaAsignada: nombreComercial,
  };
}
