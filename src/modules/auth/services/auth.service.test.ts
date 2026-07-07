import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getMe,
  login,
  mateoHandoff,
  prelogin,
  wmsSsoExchange,
} from "@/modules/auth/services/auth.service";

vi.mock("@/config/env", () => ({
  env: { apiBaseUrl: "http://localhost:3000" },
  getApiBaseUrl: () => "/api",
}));

describe("auth service happy path", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("completes prelogin for configurador (platform flow)", async () => {
    const mockPreview = {
      flow: "platform" as const,
      userPreview: {
        nombre: "Configurador",
        identificador: "configurador@polaria.tech",
      },
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockPreview,
      }),
    );

    const result = await prelogin({ identificador: "configurador@polaria.tech" });

    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/prelogin",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ identificador: "configurador@polaria.tech" }),
      }),
    );

    const call = vi.mocked(fetch).mock.calls[0];
    const headers = call[1]?.headers as Headers;
    expect(headers.get("X-Auth-Client")).toBe("wms");

    expect(result.flow).toBe("platform");
    expect(result.userPreview.nombre).toBe("Configurador");
  });

  it("completes login and returns tokens with context", async () => {
    const mockLoginResponse = {
      accessToken: "access-token",
      refreshToken: "refresh-token",
      context: { scope: "platform" as const },
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockLoginResponse,
      }),
    );

    const result = await login({
      identificador: "configurador@polaria.tech",
      password: "secret",
    });

    const call = vi.mocked(fetch).mock.calls[0];
    const headers = call[1]?.headers as Headers;
    expect(headers.get("X-Auth-Client")).toBe("wms");

    expect(result.accessToken).toBe("access-token");
    expect(result.context.scope).toBe("platform");
  });

  it("calls GET /auth/me with Bearer token and normalizes nivelRol", async () => {
    const { setAccessTokenGetter } = await import("@/services/api/api");
    setAccessTokenGetter(() => "test-token");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          idUsuario: "1",
          idAuth: "auth-1",
          nombre: "Administrador",
          username: "admin.acme",
          correo: "admin@acme.com",
          idRol: "administrador_bodega",
          nombreRol: "Administrador de bodega",
          nivelRol: "plataforma",
          codigoEmpresa: "ACME",
          razonSocialEmpresa: "ACME Corp",
          codigoCuenta: null,
          nombreComercialCuenta: null,
          idBodegas: ["BOD-01"],
          scope: "tenant",
        }),
      }),
    );

    const session = await getMe();

    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/me",
      expect.objectContaining({
        method: "GET",
        headers: expect.any(Headers),
      }),
    );

    const call = vi.mocked(fetch).mock.calls[0];
    const headers = call[1]?.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer test-token");
    expect(session.scope).toBe("tenant");
    expect(session.nombre).toBe("Administrador");
    expect(session.username).toBe("admin.acme");
    expect(session.nivelRol).toBe("platform");
  });

  it("requests mateo handoff code with Bearer token", async () => {
    const { setAccessTokenGetter } = await import("@/services/api/api");
    setAccessTokenGetter(() => "session-token");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          code: "handoff-code-123",
          expiresIn: 60,
        }),
      }),
    );

    const result = await mateoHandoff();

    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/mateo-handoff",
      expect.objectContaining({
        method: "POST",
      }),
    );

    const call = vi.mocked(fetch).mock.calls[0];
    const headers = call[1]?.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer session-token");

    expect(result.code).toBe("handoff-code-123");
    expect(result.expiresIn).toBe(60);
  });

  it("exchanges mateo SSO code without Bearer token", async () => {
    const mockExchangeResponse = {
      accessToken: "sso-access",
      refreshToken: "sso-refresh",
      user: {
        idUsuario: "1",
        username: "admin.acme",
        nombre: "Administrador",
        correo: "admin@acme.com",
        nombreRol: "Administrador",
        codigoEmpresa: "ACME",
        codigoCuenta: null,
        scope: "tenant" as const,
      },
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockExchangeResponse,
      }),
    );

    const result = await wmsSsoExchange("mateo-code-xyz");

    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/mateo-exchange",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ code: "mateo-code-xyz" }),
      }),
    );

    const call = vi.mocked(fetch).mock.calls[0];
    const headers = call[1]?.headers as Headers;
    expect(headers.get("Authorization")).toBeNull();

    expect(result.accessToken).toBe("sso-access");
    expect(result.user.scope).toBe("tenant");
  });
});
