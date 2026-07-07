import { beforeEach, describe, expect, it, vi } from "vitest";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { ApiError, apiRequest } from "@/services/api/api";
import {
  lockWarehouseStateApi,
  unlockWarehouseStateApi,
} from "./inventory-api.service";

vi.mock("@/services/api/api", () => ({
  ApiError: class ApiError extends Error {
    constructor(
      message: string,
      public readonly status: number,
      public readonly code?: string,
    ) {
      super(message);
      this.name = "ApiError";
    }
  },
  apiRequest: vi.fn(),
}));

describe("inventory-api.service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("lockWarehouseStateApi bloquea posición con versión optimista", async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      idWarehouseState: "ws-1",
      lockedBy: "user-1",
      version: 2,
    });

    await lockWarehouseStateApi("ws-1", {
      codigoCuenta: "CUENTA-01",
      idBodega: "BOD-01",
      expectedVersion: 1,
    });

    expect(apiRequest).toHaveBeenCalledWith(
      "/inventario/warehouse-state/ws-1/lock",
      {
        method: "POST",
        auth: true,
        body: {
          codigoCuenta: "CUENTA-01",
          idBodega: "BOD-01",
          expectedVersion: 1,
        },
      },
    );
  });

  it("unlockWarehouseStateApi libera posición", async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      idWarehouseState: "ws-1",
      lockedBy: null,
      version: 3,
    });

    await unlockWarehouseStateApi("ws-1", {
      codigoCuenta: "CUENTA-01",
      idBodega: "BOD-01",
      expectedVersion: 2,
    });

    expect(apiRequest).toHaveBeenCalledWith(
      "/inventario/warehouse-state/ws-1/unlock",
      {
        method: "POST",
        auth: true,
        body: {
          codigoCuenta: "CUENTA-01",
          idBodega: "BOD-01",
          expectedVersion: 2,
        },
      },
    );
  });

  it("propaga ApiError como DomainServiceError", async () => {
    vi.mocked(apiRequest).mockRejectedValue(
      new ApiError("La posición está bloqueada por otro operario", 409),
    );

    await expect(
      lockWarehouseStateApi("ws-1", {
        codigoCuenta: "CUENTA-01",
        idBodega: "BOD-01",
      }),
    ).rejects.toMatchObject({
      message: "La posición está bloqueada por otro operario",
      code: "MUTATION_FAILED",
    });
  });
});
