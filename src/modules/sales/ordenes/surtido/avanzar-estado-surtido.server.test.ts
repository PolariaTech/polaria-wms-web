import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/config/env", () => ({
  getApiBaseUrl: () => "http://api.test",
}));

import { avanzarEstadoSurtidoEnNest } from "./avanzar-estado-surtido.server";

describe("avanzarEstadoSurtidoEnNest", () => {
  const FIXTURE_INTERNAL = "fixture-internal-header";

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    process.env.INTERNAL_API_KEY = FIXTURE_INTERNAL;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.INTERNAL_API_KEY;
  });

  it("exige INTERNAL_API_KEY", async () => {
    delete process.env.INTERNAL_API_KEY;
    await expect(
      avanzarEstadoSurtidoEnNest({
        idOrdenVenta: "ov",
        estado: "alistamiento",
        codigoCuenta: "023WA",
      }),
    ).rejects.toThrow(/INTERNAL_API_KEY/);
  });

  it("POST a Nest con X-Internal-Api-Key", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "",
    } as Response);

    await avanzarEstadoSurtidoEnNest({
      idOrdenVenta: "ov-1",
      estado: "alistada",
      codigoCuenta: "023WA",
    });

    expect(fetch).toHaveBeenCalledWith(
      "http://api.test/ventas/ordenes/ov-1/avanzar-estado-surtido",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "X-Internal-Api-Key": FIXTURE_INTERNAL,
          "X-Codigo-Cuenta": "023WA",
        }),
      }),
    );
  });
});
