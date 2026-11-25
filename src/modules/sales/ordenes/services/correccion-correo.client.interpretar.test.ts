import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/config/env", () => ({ getApiBaseUrl: () => "/api" }));
vi.mock("@/lib/utils/tenant-headers", () => ({
  applyTenantHeaders: (headers: Headers) => {
    headers.set("X-Codigo-Empresa", "EMP001");
  },
}));
vi.mock("@/stores/auth.store", () => ({
  useAuthStore: { getState: () => ({ accessToken: "token-de-prueba" }) },
}));

import { CorreccionCorreoApiError } from "./correccion-correo.client.types";
import { interpretarInstruccion } from "./correccion-correo.client.interpretar";

const REQUEST_ID = "770e8400-e29b-41d4-a716-446655440002";
const ID_OV = "550e8400-e29b-41d4-a716-446655440000";
const BASE = `/api/ventas/ordenes/${ID_OV}/ordenes-trabajo`;

function respuesta(status: number, cuerpo: unknown): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("interpretarInstruccion", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("hace POST al endpoint de la OV con JWT y tenant, sin codigoCuenta, y recorta la instrucción", async () => {
    fetchMock.mockResolvedValue(
      respuesta(200, { requestId: REQUEST_ID, intencion: "reorganizar", motivo: "x", expectativas: {}, porReglas: false }),
    );

    await interpretarInstruccion({
      idOrdenVenta: ID_OV,
      requestId: REQUEST_ID,
      instruccion: "  junta comedor y bares  ",
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE}/interpretar-instruccion`);
    expect(init.method).toBe("POST");
    const headers = init.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer token-de-prueba");
    expect(headers.get("X-Codigo-Empresa")).toBe("EMP001");
    expect(JSON.parse(String(init.body))).toEqual({
      requestId: REQUEST_ID,
      instruccion: "junta comedor y bares",
    });
  });

  it("devuelve la intención, el motivo y las expectativas válidas (descarta valores no numéricos)", async () => {
    fetchMock.mockResolvedValue(
      respuesta(200, {
        requestId: REQUEST_ID,
        intencion: "releer_documentos",
        motivo: "Habla del total de la factura.",
        expectativas: { totalOt: 21, importeTotal: 27905.25, otro: "x" },
        porReglas: true,
      }),
    );
    const r = await interpretarInstruccion({ idOrdenVenta: ID_OV, requestId: REQUEST_ID, instruccion: "x" });
    expect(r).toEqual({
      intencion: "releer_documentos",
      motivo: "Habla del total de la factura.",
      expectativas: { totalOt: 21, importeTotal: 27905.25 },
      porReglas: true,
    });

    fetchMock.mockResolvedValue(
      respuesta(200, {
        requestId: REQUEST_ID,
        intencion: "reorganizar",
        motivo: "",
        expectativas: { totalOt: "21", importeTotal: -5 },
      }),
    );
    const sin = await interpretarInstruccion({ idOrdenVenta: ID_OV, requestId: REQUEST_ID, instruccion: "x" });
    expect(sin.expectativas).toEqual({});
    expect(sin.porReglas).toBe(false);
  });

  it("rechaza una intención desconocida o un requestId que no corresponde", async () => {
    fetchMock.mockResolvedValueOnce(respuesta(200, { requestId: REQUEST_ID, intencion: "borrar_todo" }));
    await expect(
      interpretarInstruccion({ idOrdenVenta: ID_OV, requestId: REQUEST_ID, instruccion: "x" }),
    ).rejects.toMatchObject({ codigo: "RESPUESTA_INESPERADA" });

    fetchMock.mockResolvedValueOnce(respuesta(200, { requestId: "otra", intencion: "reorganizar" }));
    await expect(
      interpretarInstruccion({ idOrdenVenta: ID_OV, requestId: REQUEST_ID, instruccion: "x" }),
    ).rejects.toMatchObject({ codigo: "RESPUESTA_INESPERADA" });
  });

  it("traduce los errores HTTP", async () => {
    fetchMock.mockResolvedValueOnce(respuesta(409, { error: "OV_ESTADO_CAMBIO" }));
    await expect(
      interpretarInstruccion({ idOrdenVenta: ID_OV, requestId: REQUEST_ID, instruccion: "x" }),
    ).rejects.toMatchObject({ codigo: "OV_ESTADO_CAMBIO" });
    fetchMock.mockResolvedValueOnce(respuesta(404, {}));
    await expect(
      interpretarInstruccion({ idOrdenVenta: ID_OV, requestId: REQUEST_ID, instruccion: "x" }),
    ).rejects.toMatchObject({ codigo: "NO_ENCONTRADA" });
  });

  it("un 400 pide revisar la instrucción, con el mensaje que define el schema del formulario", async () => {
    fetchMock.mockResolvedValueOnce(respuesta(400, {}));

    const error = await interpretarInstruccion({
      idOrdenVenta: ID_OV,
      requestId: REQUEST_ID,
      instruccion: "x",
    }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(CorreccionCorreoApiError);
    expect(error).toMatchObject({
      codigo: "SOLICITUD_INVALIDA",
      message: "La solicitud no es válida. Revisa la instrucción e inténtalo de nuevo.",
    });
  });
});