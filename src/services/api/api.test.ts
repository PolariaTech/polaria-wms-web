import { beforeEach, describe, expect, it, vi } from "vitest";
import { mapApiError, setAccessTokenGetter } from "@/services/api/api";
import { setTenantHeadersGetter } from "@/lib/utils/tenant-headers";

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

  it("maps 403 usando mensaje del backend si existe", () => {
    const error = mapApiError(403, "No tiene permisos para inventory:write");
    expect(error.message).toBe("No tiene permisos para inventory:write");
  });

  it("maps 429 a mensaje de espera de 1 minuto", () => {
    const error = mapApiError(429, "ThrottlerException: Too Many Requests");
    expect(error.message).toBe(
      "Hay demasiadas peticiones en poco tiempo. Espera 1 minuto e inténtalo de nuevo.",
    );
    expect(error.code).toBe("RATE_LIMITED");
  });

  it("normaliza mensajes de throttle aunque el status no sea 429", () => {
    const error = mapApiError(400, "Too Many Requests");
    expect(error.message).toContain("Espera 1 minuto");
    expect(error.code).toBe("RATE_LIMITED");
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

    const { apiRequest } = await import("@/services/api/api");
    await apiRequest("/inventory", { method: "GET", auth: true });

    const call = vi.mocked(fetch).mock.calls[0];
    const headers = call[1]?.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer test-token");
    expect(headers.get("X-Codigo-Empresa")).toBe("ACME");
    expect(headers.get("X-Codigo-Cuenta")).toBe("CUENTA-01");
    expect(headers.get("X-Id-Bodega")).toBe("BOD-01");
  });

  it("reintenta una vez tras 401 si el refresh renueva el token", async () => {
    vi.resetModules();

    let token = "old-token";
    vi.doMock("@/lib/auth/refresh-auth-tokens", () => ({
      refreshAuthTokens: vi.fn().mockImplementation(async () => {
        token = "new-token";
        return true;
      }),
    }));

    const { apiRequest, setAccessTokenGetter: setToken } = await import(
      "@/services/api/api"
    );
    const { setTenantHeadersGetter: setTenant } = await import(
      "@/lib/utils/tenant-headers"
    );

    setToken(() => token);
    setTenant(() => ({
      codigoEmpresa: "ACME",
      codigoCuenta: "CUENTA-01",
      idBodega: "BOD-01",
    }));

    let calls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async () => {
        calls += 1;
        if (calls === 1) {
          return {
            ok: false,
            status: 401,
            json: async () => ({ message: "Token inválido o expirado" }),
          };
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({ ok: true }),
        };
      }),
    );

    const result = await apiRequest<{ ok: boolean }>("/auth/me", {
      method: "GET",
      auth: true,
    });

    expect(result).toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledTimes(2);
    const secondHeaders = vi.mocked(fetch).mock.calls[1][1]?.headers as Headers;
    expect(secondHeaders.get("Authorization")).toBe("Bearer new-token");
  });
});
