import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { ApiError, apiRequest } from "@/services/api/api";
import type {
  LockWarehouseStateApiInput,
  WarehouseStateApiRow,
} from "../types/inventory-api.types";

async function postInventarioApi<T>(path: string, body: unknown): Promise<T> {
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

function validateLockInput(input: LockWarehouseStateApiInput): LockWarehouseStateApiInput {
  const codigoCuenta = input.codigoCuenta.trim();
  const idBodega = input.idBodega.trim();

  if (!codigoCuenta) {
    throw new DomainServiceError(
      "No se encontró la cuenta activa.",
      "INVALID_ARGUMENT",
    );
  }

  if (!idBodega) {
    throw new DomainServiceError(
      "No se encontró la bodega activa.",
      "INVALID_ARGUMENT",
    );
  }

  return {
    codigoCuenta,
    idBodega,
    ...(input.expectedVersion != null
      ? { expectedVersion: input.expectedVersion }
      : {}),
  };
}

/** Bloquea una posición del mapa de inventario (POL-6). */
export async function lockWarehouseStateApi(
  idWarehouseState: string,
  input: LockWarehouseStateApiInput,
): Promise<WarehouseStateApiRow> {
  const id = idWarehouseState.trim();

  if (!id) {
    throw new DomainServiceError(
      "La posición de inventario no es válida.",
      "INVALID_ARGUMENT",
    );
  }

  const body = validateLockInput(input);

  return postInventarioApi<WarehouseStateApiRow>(
    `/inventario/warehouse-state/${encodeURIComponent(id)}/lock`,
    body,
  );
}

/** Libera el bloqueo de una posición del mapa (POL-6). */
export async function unlockWarehouseStateApi(
  idWarehouseState: string,
  input: LockWarehouseStateApiInput,
): Promise<WarehouseStateApiRow> {
  const id = idWarehouseState.trim();

  if (!id) {
    throw new DomainServiceError(
      "La posición de inventario no es válida.",
      "INVALID_ARGUMENT",
    );
  }

  const body = validateLockInput(input);

  return postInventarioApi<WarehouseStateApiRow>(
    `/inventario/warehouse-state/${encodeURIComponent(id)}/unlock`,
    body,
  );
}
