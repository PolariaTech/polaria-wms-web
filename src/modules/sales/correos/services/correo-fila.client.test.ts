import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/config/env", () => ({ getApiBaseUrl: () => "/api" }));
vi.mock("@/lib/utils/tenant-headers", () => ({ applyTenantHeaders: vi.fn() }));
vi.mock("@/stores/auth.store", () => ({
  useAuthStore: { getState: () => ({ accessToken: "t" }) },
}));

import { CorreosApiError } from "./correos.client";
import { obtenerFilaCorreo } from "./correo-fila.client";

describe("obtenerFilaCorreo (REQ-318)", () => {
  let fetchMock: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchMock = vi.spyOn(globalThis, "fetch");
  });
  afterEach(() => {
    fetchMock.mockRestore();
  });

  it("GET a la fila con el messageId codificado", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          messageId: "a/b c",
          ingreso: {
            messageId: "a/b c",
            estado: "ingresado",
            idOrdenVenta: "7",
            codigoOrdenVenta: "OV-00000123",
            error: null,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const fila = await obtenerFilaCorreo("a/b c");

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toBe("/api/ventas/correos/a%2Fb%20c");
    expect(fila.messageId).toBe("a/b c");
    expect(fila.ingreso).toMatchObject({
      estado: "ingresado",
      codigoOrdenVenta: "OV-00000123",
    });
  });

  it("un 404 rechaza con NO_ENCONTRADO", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: "CORREO_NO_ENCONTRADO" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(obtenerFilaCorreo("abc123def")).rejects.toBeInstanceOf(
      CorreosApiError,
    );
    await expect(obtenerFilaCorreo("abc123def")).rejects.toMatchObject({
      codigo: "NO_ENCONTRADO",
    });
  });

  it("un cuerpo sin messageId rechaza con RESPUESTA_INESPERADA", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ asunto: "Pedido" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(obtenerFilaCorreo("abc123def")).rejects.toMatchObject({
      codigo: "RESPUESTA_INESPERADA",
    });
  });
});
