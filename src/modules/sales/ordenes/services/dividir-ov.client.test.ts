import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/config/env", () => ({ getApiBaseUrl: () => "/api" }));
vi.mock("@/lib/utils/tenant-headers", () => ({
  applyTenantHeaders: (headers: Headers) => {
    headers.set("X-Codigo-Empresa", "EMP001");
  },
}));
vi.mock("@/stores/auth.store", () => ({
  useAuthStore: { getState: () => ({ accessToken: ["sesion", "simulada"].join("-") }) },
}));

import { dividirOrdenVenta } from "./dividir-ov.client";

const ID_OV = "550e8400-e29b-41d4-a716-446655440000";

function respuesta(status: number, cuerpo: unknown): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const ok = {
  idOrdenVenta: ID_OV,
  ordenesNuevas: [{ idOrdenVenta: "nueva-1", codigo: "OV-2", valor: "4502988746" }],
  valoresQuedan: ["4502988065"],
};

describe("dividirOrdenVenta", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("hace POST a dividir con JWT, tenant y solo las órdenes de compra que salen", async () => {
    fetchMock.mockResolvedValue(respuesta(200, ok));

    const res = await dividirOrdenVenta({
      idOrdenVenta: ID_OV,
      criterio: "dia",
      valoresSalen: ["4502988746"],
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`/api/ventas/ordenes/${ID_OV}/ordenes-trabajo/dividir`);
    expect(init.method).toBe("POST");
    expect((init.headers as Headers).get("Authorization")).toBe("Bearer sesion-simulada");
    expect(JSON.parse(init.body as string)).toEqual({
      criterio: "dia",
      valoresSalen: ["4502988746"],
    });
    expect(res).toEqual({
      ordenesNuevas: ok.ordenesNuevas,
      valoresQuedan: ["4502988065"],
    });
  });

  it("traduce los errores del servidor a mensajes en lenguaje claro", async () => {
    fetchMock.mockResolvedValueOnce(respuesta(409, { error: "OV_ESTADO_CAMBIO" }));
    await expect(
      dividirOrdenVenta({ idOrdenVenta: ID_OV, criterio: "oc", valoresSalen: ["1"] }),
    ).rejects.toMatchObject({
      codigo: "OV_ESTADO_CAMBIO",
      message: "Esta orden ya no está por confirmar.",
    });

    fetchMock.mockResolvedValueOnce(respuesta(404, {}));
    await expect(
      dividirOrdenVenta({ idOrdenVenta: ID_OV, criterio: "oc", valoresSalen: ["1"] }),
    ).rejects.toMatchObject({ codigo: "NO_ENCONTRADA" });
  });

  it("un fallo de red se informa sin detalles técnicos", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    await expect(
      dividirOrdenVenta({ idOrdenVenta: ID_OV, criterio: "oc", valoresSalen: ["1"] }),
    ).rejects.toMatchObject({ codigo: "RED" });
  });

  it("una respuesta con otro formato se rechaza", async () => {
    fetchMock.mockResolvedValue(respuesta(200, { ordenesNuevas: [{}], valoresQuedan: [] }));

    await expect(
      dividirOrdenVenta({ idOrdenVenta: ID_OV, criterio: "oc", valoresSalen: ["1"] }),
    ).rejects.toMatchObject({ codigo: "RESPUESTA_INESPERADA" });
  });
});
