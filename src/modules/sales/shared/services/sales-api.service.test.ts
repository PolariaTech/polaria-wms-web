import { beforeEach, describe, expect, it, vi } from "vitest";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { ApiError, apiRequest } from "@/services/api/api";
import {
  avanzarEstadoOrdenVentaApi,
  cancelarOrdenVentaApi,
  listOrdenesVentaParaSalida,
} from "./sales-api.service";

vi.mock("@/services/api/api", () => ({
  ApiError: class ApiError extends Error {
    constructor(message: string) {
      super(message);
    }
  },
  apiRequest: vi.fn(),
}));

const apiRequestMock = vi.mocked(apiRequest);

describe("sales-api.service", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
  });

  it("listOrdenesVentaParaSalida propaga fallo Nest sin fallback Supabase", async () => {
    apiRequestMock.mockRejectedValue(new ApiError("nest caído"));

    await expect(
      listOrdenesVentaParaSalida({ codigoCuenta: "emp1" }),
    ).rejects.toBeInstanceOf(DomainServiceError);

    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    expect(apiRequestMock.mock.calls[0]?.[0]).toContain("paraSalida=true");
  });

  it("avanzarEstadoOrdenVentaApi llama POST avanzar-estado", async () => {
    apiRequestMock.mockResolvedValue({ idOrdenVenta: "ov-1", estado: "alistada" });

    const row = await avanzarEstadoOrdenVentaApi("ov-1", "alistada");

    expect(row.estado).toBe("alistada");
    expect(apiRequestMock).toHaveBeenCalledWith(
      "/ventas/ordenes/ov-1/avanzar-estado",
      expect.objectContaining({
        method: "POST",
        auth: true,
        body: { estado: "alistada" },
      }),
    );
  });

  it("avanzarEstadoOrdenVentaApi rechaza id vacío", async () => {
    await expect(avanzarEstadoOrdenVentaApi(" ", "alistada")).rejects.toBeInstanceOf(
      DomainServiceError,
    );
  });

  it("cancelarOrdenVentaApi mapea ApiError", async () => {
    apiRequestMock.mockRejectedValue(new ApiError("conflicto"));
    await expect(cancelarOrdenVentaApi("ov-1")).rejects.toBeInstanceOf(
      DomainServiceError,
    );
  });
});