import { beforeEach, describe, expect, it, vi } from "vitest";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { ApiError, apiRequest } from "@/services/api/api";
import { postComprasApi, requestComprasApi } from "./purchases-api.service.http";

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

describe("purchases-api.service.http", () => {
  beforeEach(() => {
    vi.mocked(apiRequest).mockReset();
  });

  it("requestComprasApi usa GET autenticado por defecto", async () => {
    vi.mocked(apiRequest).mockResolvedValue({ ok: true });

    await expect(requestComprasApi("/compras/x")).resolves.toEqual({ ok: true });
    expect(apiRequest).toHaveBeenCalledWith("/compras/x", {
      method: "GET",
      auth: true,
      body: undefined,
    });
  });

  it("requestComprasApi convierte ApiError en DomainServiceError", async () => {
    vi.mocked(apiRequest).mockRejectedValue(new ApiError("boom", 500));

    await expect(requestComprasApi("/compras/x")).rejects.toBeInstanceOf(
      DomainServiceError,
    );
  });

  it("requestComprasApi propaga errores desconocidos", async () => {
    const error = new Error("otro");
    vi.mocked(apiRequest).mockRejectedValue(error);

    await expect(requestComprasApi("/compras/x")).rejects.toBe(error);
  });

  it("postComprasApi envía POST con body", async () => {
    vi.mocked(apiRequest).mockResolvedValue({ id: 1 });

    await postComprasApi("/compras/y", { a: 1 });

    expect(apiRequest).toHaveBeenCalledWith("/compras/y", {
      method: "POST",
      auth: true,
      body: { a: 1 },
    });
  });
});
