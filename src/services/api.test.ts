import { beforeEach, describe, expect, it, vi } from "vitest";
import { mapApiError, setAccessTokenGetter } from "@/services/api";
import { setTenantHeadersGetter } from "@/lib/tenant-headers";

describe("mapApiError", () => {
  it("maps 401 to credenciales inválidas", () => {
    const error = mapApiError(401);
    expect(error.message).toBe("Credenciales inválidas");
    expect(error.status).toBe(401);
  });

  it("maps 422 to código de empresa requerido", () => {
    const error = mapApiError(422);
    expect(error.message).toBe("Debes ingresar código de empresa");
  });

  it("maps 5xx to server error", () => {
    const error = mapApiError(500);
    expect(error.message).toContain("Error del servidor");
  });
});

describe("apiRequest tenant headers", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setAccessTokenGetter(() => "test-token");
    setTenantHeadersGetter(() => ({
      codigoEmpresa: "ACME",
      codigoCuenta: "CUENTA-01",
      idBodega: "BOD-01",
    }));
  });

  it("envía headers tenant en peticiones autenticadas", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
      }),
    );

    const { apiRequest } = await import("@/services/api");
    await apiRequest("/inventory", { method: "GET", auth: true });

    const call = vi.mocked(fetch).mock.calls[0];
    const headers = call[1]?.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer test-token");
    expect(headers.get("X-Codigo-Empresa")).toBe("ACME");
    expect(headers.get("X-Codigo-Cuenta")).toBe("CUENTA-01");
    expect(headers.get("X-Id-Bodega")).toBe("BOD-01");
  });
});
