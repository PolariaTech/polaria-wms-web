import { afterEach, describe, expect, it, vi } from "vitest";
import { leerPedidoEnMateoIa } from "./mateo-ia.client";

describe("leerPedidoEnMateoIa", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("llama POST /pedidos/leer con X-Api-Key", async () => {
    vi.stubEnv("MATEO_IA_API_URL", "http://mateo.test");
    vi.stubEnv("MATEO_IA_API_KEY", "clave-prueba-local");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          pedido: { lineas: [] },
          grupos: [],
          textoOrigen: "ok",
          documentos: [],
          advertencias: [],
          catalogoProductos: 1,
          tokensTotal: 0,
          costoUSD: null,
        }),
        { status: 200 },
      ),
    );

    const r = await leerPedidoEnMateoIa({
      texto: "hola",
      archivos: [],
      catalogoClaves: ["NARANJA DULCE (1)"],
      presentaciones: [""],
    });

    expect(r.textoOrigen).toBe("ok");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://mateo.test/pedidos/leer",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "X-Api-Key": "clave-prueba-local",
        }),
      }),
    );
  });
});
