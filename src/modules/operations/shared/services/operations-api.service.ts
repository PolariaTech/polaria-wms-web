import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { ApiError, apiRequest } from "@/services/api/api";
import type { TareaColaRow } from "@/modules/processing/shared/types/processing.types";
import type {
  AlertaOperativaApiRow,
  BodegaReportesApiResumen,
  CreateOrdenTrabajoApiInput,
  EjecutarOrdenTrabajoApiInput,
  LlamadaOperativaApiRow,
  OrdenTrabajoApiRow,
  TareaColaApiRow,
  TenantBodegaApiParams,
} from "../types/operations-api.types";

function tenantQuery(params: TenantBodegaApiParams): string {
  const codigoCuenta = encodeURIComponent(params.codigoCuenta.trim());
  const idBodega = encodeURIComponent(params.idBodega.trim());
  return `codigoCuenta=${codigoCuenta}&idBodega=${idBodega}`;
}

async function mutateApi<T>(
  path: string,
  method: "POST" | "PATCH",
  body?: unknown,
): Promise<T> {
  try {
    return await apiRequest<T>(path, { method, auth: true, body });
  } catch (error) {
    if (error instanceof ApiError) {
      throw new DomainServiceError(error.message, "MUTATION_FAILED", error);
    }
    throw error;
  }
}

function mapTareaColaRow(row: TareaColaApiRow): TareaColaRow {
  return {
    id_tarea: row.idTarea,
    codigo_cuenta: row.codigoCuenta,
    id_bodega: row.idBodega,
    tipo: row.tipo as TareaColaRow["tipo"],
    estado: row.estado as TareaColaRow["estado"],
    id_asignado: row.idAsignado,
    id_orden_trabajo: row.idOrdenTrabajo,
    titulo: row.titulo,
    descripcion: row.descripcion,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  };
}

export async function listOrdenesTrabajoApi(
  params: TenantBodegaApiParams & { estado?: string; tipoFlujo?: string },
): Promise<OrdenTrabajoApiRow[]> {
  const qs = tenantQuery(params);
  const extra = [
    params.estado ? `estado=${encodeURIComponent(params.estado)}` : "",
    params.tipoFlujo ? `tipoFlujo=${encodeURIComponent(params.tipoFlujo)}` : "",
  ]
    .filter(Boolean)
    .join("&");

  return apiRequest<OrdenTrabajoApiRow[]>(
    `/operaciones/ordenes-trabajo?${qs}${extra ? `&${extra}` : ""}`,
    { auth: true },
  );
}

export async function createOrdenTrabajoApi(
  input: CreateOrdenTrabajoApiInput,
): Promise<OrdenTrabajoApiRow> {
  return mutateApi<OrdenTrabajoApiRow>(
    "/operaciones/ordenes-trabajo",
    "POST",
    input,
  );
}

export async function ejecutarOrdenTrabajoApi(
  idOrdenTrabajo: string,
  input: EjecutarOrdenTrabajoApiInput,
): Promise<OrdenTrabajoApiRow> {
  return mutateApi<OrdenTrabajoApiRow>(
    `/operaciones/ordenes-trabajo/${encodeURIComponent(idOrdenTrabajo)}/ejecutar`,
    "POST",
    input,
  );
}

export async function listTareasColaApi(
  params: TenantBodegaApiParams & { estado?: string; idAsignado?: string },
): Promise<TareaColaRow[]> {
  const qs = tenantQuery(params);
  const extra = [
    params.estado ? `estado=${encodeURIComponent(params.estado)}` : "",
    params.idAsignado
      ? `idAsignado=${encodeURIComponent(params.idAsignado)}`
      : "",
  ]
    .filter(Boolean)
    .join("&");

  const rows = await apiRequest<TareaColaApiRow[]>(
    `/operaciones/tareas?${qs}${extra ? `&${extra}` : ""}`,
    { auth: true },
  );

  return rows.map(mapTareaColaRow);
}

export async function asignarTareaColaApi(
  idTarea: string,
  params: TenantBodegaApiParams & { idAsignado?: string },
): Promise<TareaColaRow> {
  const row = await mutateApi<TareaColaApiRow>(
    `/operaciones/tareas/${encodeURIComponent(idTarea)}/asignar`,
    "PATCH",
    params,
  );
  return mapTareaColaRow(row);
}

export async function completarTareaColaApi(
  idTarea: string,
  params: TenantBodegaApiParams,
): Promise<TareaColaRow> {
  const row = await mutateApi<TareaColaApiRow>(
    `/operaciones/tareas/${encodeURIComponent(idTarea)}/completar`,
    "POST",
    params,
  );
  return mapTareaColaRow(row);
}

export async function listAlertasOperativasApi(
  params: TenantBodegaApiParams & { estado?: string },
): Promise<AlertaOperativaApiRow[]> {
  const qs = tenantQuery(params);
  const extra = params.estado
    ? `&estado=${encodeURIComponent(params.estado)}`
    : "";

  return apiRequest<AlertaOperativaApiRow[]>(
    `/operaciones/alertas?${qs}${extra}`,
    { auth: true },
  );
}

export async function crearLlamadaJefeApi(
  params: TenantBodegaApiParams & { message?: string },
): Promise<LlamadaOperativaApiRow> {
  return mutateApi<LlamadaOperativaApiRow>(
    "/operaciones/llamadas",
    "POST",
    params,
  );
}

export async function getBodegaReportesApi(
  params: TenantBodegaApiParams,
): Promise<BodegaReportesApiResumen> {
  return apiRequest<BodegaReportesApiResumen>(
    `/operaciones/reportes/bodega?${tenantQuery(params)}`,
    { auth: true },
  );
}
