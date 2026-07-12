import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { ApiError, apiRequest } from "@/services/api/api";
import type { OrdenVentaOperadorRow } from "../types/sales.types";
import { mapOrdenVentaOperadorApiRow } from "../utils/orden-venta-api.mapper";
import { listOrdenesVentaOperador } from "./sales.service";

async function postVentasApi<T>(path: string, body?: unknown): Promise<T> {
  try {
    return await apiRequest<T>(path, {
      method: "POST",
      auth: true,
      body,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw new DomainServiceError(error.message, "MUTATION_FAILED", error);
    }
    throw error;
  }
}

/** Emite una OV en borrador (confirmación operativa + tareas de bodega). Requiere API Nest. */
export async function emitirOrdenVentaApi(
  idOrdenVenta: string,
): Promise<OrdenVentaOperadorRow> {
  const id = idOrdenVenta.trim();
  if (!id) {
    throw new DomainServiceError(
      "La orden de venta no es válida.",
      "INVALID_ARGUMENT",
    );
  }

  return postVentasApi<OrdenVentaOperadorRow>(
    `/ventas/ordenes/${encodeURIComponent(id)}/emitir`,
  );
}

export async function listOrdenesVentaApi(params: {
  codigoCuenta: string;
  idBodega?: string;
  paraSalida?: boolean;
}): Promise<OrdenVentaOperadorRow[]> {
  const codigoCuenta = params.codigoCuenta.trim();
  if (!codigoCuenta) {
    throw new DomainServiceError(
      "El código de cuenta no es válido.",
      "INVALID_ARGUMENT",
    );
  }

  const query = new URLSearchParams({ codigoCuenta });
  if (params.idBodega?.trim()) {
    query.set("idBodega", params.idBodega.trim());
  }
  if (params.paraSalida) {
    query.set("paraSalida", "true");
  }

  const rows = await apiRequest<Record<string, unknown>[]>(
    `/ventas/ordenes?${query.toString()}`,
    { auth: true },
  );

  return rows.map(mapOrdenVentaOperadorApiRow);
}

/** OVs confirmadas pendientes de registrar salida (picker del jefe). */
export async function listOrdenesVentaParaSalida(params: {
  codigoCuenta: string;
  idBodega?: string | null;
}): Promise<OrdenVentaOperadorRow[]> {
  const codigoCuenta = params.codigoCuenta.trim();
  if (!codigoCuenta) return [];

  try {
    return await listOrdenesVentaApi({
      codigoCuenta,
      idBodega: params.idBodega?.trim() || undefined,
      paraSalida: true,
    });
  } catch {
    const rows = await listOrdenesVentaOperador({
      codigoCuenta,
      idBodega: params.idBodega ?? undefined,
    });
    return rows.filter((row) => row.estado === "confirmada");
  }
}
