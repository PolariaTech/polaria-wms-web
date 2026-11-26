import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { moverAdjuntoOrdenVenta } from "./mover-adjunto-ov.client";

vi.mock("@/config/env", () => ({
  getApiBaseUrl: () => "/api",
}));

vi.mock("@/lib/utils/tenant-headers", () => ({
  applyTenantHeaders: (headers: Headers) => headers.set("x-tenant", "demo"),
}));

vi.mock("@/stores/auth.store", () => ({
  useAuthStore: {
    getState: () => ({ accessToken: null }),
  },
}));

const ID_ORIGEN = "11111111-1111-4111-8111-111111111111";
const ID_DESTINO = "22222222-2222-4222-8222-222222222222";

describe("moverAdjuntoOrdenVenta (REQ-361)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("envía POST con destino y path, y devuelve la respuesta", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        idOrdenVentaOrigen: ID_ORIGEN,
        idOrdenVentaDestino: ID_DESTINO,
        path: "DEMO/a.pdf",
      }),
    } as Response);

    const resultado = await moverAdjuntoOrdenVenta({
      idOrdenVenta: ID_ORIGEN,
      idOrdenVentaDestino: ID_DESTINO,
      path: "DEMO/a.pdf",
    });

    expect(mockFetch).toHaveBeenCalledWith(
      `/api/ventas/ordenes/${ID_ORIGEN}/adjuntos/mover`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ idOrdenVentaDestino: ID_DESTINO, path: "DEMO/a.pdf" }),
      }),
    );
    expect(resultado.idOrdenVentaDestino).toBe(ID_DESTINO);
  });

  it("propaga el mensaje de error del servidor cuando falla", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ message: "Las dos órdenes de venta no vienen del mismo correo." }),
    } as Response);

    await expect(
      moverAdjuntoOrdenVenta({
        idOrdenVenta: ID_ORIGEN,
        idOrdenVentaDestino: ID_DESTINO,
        path: "DEMO/a.pdf",
      }),
    ).rejects.toThrow("Las dos órdenes de venta no vienen del mismo correo.");
  });

  it("informa error de red cuando fetch rechaza", async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(
      moverAdjuntoOrdenVenta({
        idOrdenVenta: ID_ORIGEN,
        idOrdenVentaDestino: ID_DESTINO,
        path: "DEMO/a.pdf",
      }),
    ).rejects.toThrow("No se pudo conectar con el servidor");
  });
});
