import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  refreshAuthTokens: vi.fn(),
  notifySessionExpired: vi.fn(),
}));

vi.mock("@/lib/auth/refresh-auth-tokens", () => ({
  refreshAuthTokens: () => mocks.refreshAuthTokens(),
}));

vi.mock("@/lib/auth/session-expired", () => ({
  notifySessionExpired: (path: string) => mocks.notifySessionExpired(path),
}));

function respuesta401() {
  return {
    ok: false,
    status: 401,
    json: async () => ({ message: "Token inválido o expirado" }),
  };
}

function respuestaOk() {
  return { ok: true, status: 200, json: async () => ({ ok: true }) };
}

describe("apiRequest · sesión expirada", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { setAccessTokenGetter } = await import("@/services/api/api");
    setAccessTokenGetter(() => "token-de-prueba");
  });

  it("avisa cuando el API rechaza el token y no se puede renovar", async () => {
    mocks.refreshAuthTokens.mockResolvedValue(false);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respuesta401()));
    const { apiRequest } = await import("@/services/api/api");

    await expect(
      apiRequest("/auth/me", { method: "GET", auth: true }),
    ).rejects.toMatchObject({ status: 401 });

    expect(mocks.notifySessionExpired).toHaveBeenCalledOnce();
    expect(mocks.notifySessionExpired).toHaveBeenCalledWith("/auth/me");
  });

  it("avisa si el token se renovó pero el API lo vuelve a rechazar", async () => {
    mocks.refreshAuthTokens.mockResolvedValue(true);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respuesta401()));
    const { apiRequest } = await import("@/services/api/api");

    await expect(
      apiRequest("/auth/me", { method: "GET", auth: true }),
    ).rejects.toMatchObject({ status: 401 });

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(mocks.notifySessionExpired).toHaveBeenCalledOnce();
  });

  it("no avisa si el token se renueva y la repetición funciona", async () => {
    mocks.refreshAuthTokens.mockResolvedValue(true);
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(respuesta401())
        .mockResolvedValueOnce(respuestaOk()),
    );
    const { apiRequest } = await import("@/services/api/api");

    await expect(
      apiRequest("/auth/me", { method: "GET", auth: true }),
    ).resolves.toEqual({ ok: true });

    expect(mocks.notifySessionExpired).not.toHaveBeenCalled();
  });

  it("no avisa si la petición no llevaba token (no había sesión)", async () => {
    const { apiRequest, setAccessTokenGetter } = await import(
      "@/services/api/api"
    );
    setAccessTokenGetter(() => null);
    mocks.refreshAuthTokens.mockResolvedValue(false);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respuesta401()));

    await expect(
      apiRequest("/auth/me", { method: "GET", auth: true }),
    ).rejects.toMatchObject({ status: 401 });

    expect(mocks.notifySessionExpired).not.toHaveBeenCalled();
  });

  it("no avisa en peticiones sin autenticar, como el login con credenciales malas", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respuesta401()));
    const { apiRequest } = await import("@/services/api/api");

    await expect(
      apiRequest("/auth/login", { method: "POST", body: { x: 1 } }),
    ).rejects.toMatchObject({ status: 401 });

    expect(mocks.refreshAuthTokens).not.toHaveBeenCalled();
    expect(mocks.notifySessionExpired).not.toHaveBeenCalled();
  });

  it("no avisa con errores distintos de 401", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ message: "Sin permiso" }),
      }),
    );
    const { apiRequest } = await import("@/services/api/api");

    await expect(
      apiRequest("/inventory", { method: "GET", auth: true }),
    ).rejects.toMatchObject({ status: 403 });

    expect(mocks.notifySessionExpired).not.toHaveBeenCalled();
  });
});
