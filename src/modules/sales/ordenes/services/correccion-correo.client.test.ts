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

import {
  CorreccionCorreoApiError,
  interpretarInstruccion,
  solicitarCorreccionCorreo,
} from "./correccion-correo.client";

const REQUEST_ID = "770e8400-e29b-41d4-a716-446655440002";
const ID_OV = "550e8400-e29b-41d4-a716-446655440000";
const JOB_ID = "990e8400-e29b-41d4-a716-446655440010";
const BASE = `/api/ventas/ordenes/${ID_OV}/ordenes-trabajo`;

function respuesta(status: number, cuerpo: unknown): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const propuestaOk = {
  requestId: REQUEST_ID,
  propuestaId: "prop-1",
  baseHash: "a".repeat(64),
  documentos: [
    {
      nombre: "pedido.pdf",
      oc: "4502987208",
      ocFuente: "ambas",
      renglones: 82,
      verificacion: { totalDocumento: 11500.6, importe: 11500.6, diferencia: 0, cuadra: true },
      relecturaPorBloques: false,
    },
  ],
  ots: [],
  resumen: {
    otAntes: 6,
    otDespues: 12,
    renglonesAntes: 60,
    renglonesDespues: 82,
    importeAntes: 100,
    importeDespues: 11500.6,
  },
  diff: { otNuevas: [], otEliminadas: [], renglonesAgregados: 22, renglonesQuitados: 0 },
  advertencias: [],
};

const iniciada = { requestId: REQUEST_ID, jobId: JOB_ID, estado: "procesando" };

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

describe("solicitarCorreccionCorreo (inicia y consulta el avance)", () => {
  const fetchMock = vi.fn();
  const esperar = vi.fn().mockResolvedValue(undefined);

  const llamar = (extra: Partial<Parameters<typeof solicitarCorreccionCorreo>[0]> = {}) =>
    solicitarCorreccionCorreo({
      idOrdenVenta: ID_OV,
      requestId: REQUEST_ID,
      esperar,
      intervaloMs: 10,
      ...extra,
    });

  beforeEach(() => {
    fetchMock.mockReset();
    esperar.mockClear();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("el POST responde 202 con un jobId y se consulta hasta que está listo", async () => {
    fetchMock
      .mockResolvedValueOnce(respuesta(202, iniciada))
      .mockResolvedValueOnce(respuesta(200, { estado: "procesando" }))
      .mockResolvedValueOnce(respuesta(200, { estado: "listo", propuesta: propuestaOk }));

    const r = await llamar();

    expect(r.propuestaId).toBe("prop-1");
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const [urlPost, initPost] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(urlPost).toBe(`${BASE}/propuesta-correccion-correo`);
    expect(initPost.method).toBe("POST");
    expect(JSON.parse(String(initPost.body))).toEqual({ requestId: REQUEST_ID });
    const [urlGet, initGet] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(urlGet).toBe(`${BASE}/propuesta-correccion-correo/${JOB_ID}`);
    expect(initGet.method).toBe("GET");
    expect((initGet.headers as Headers).get("Authorization")).toBe("Bearer token-de-prueba");
    expect(esperar).toHaveBeenCalledTimes(2);
  });

  it("envía la nota y las expectativas solo si las hay", async () => {
    fetchMock
      .mockResolvedValueOnce(respuesta(202, iniciada))
      .mockResolvedValueOnce(respuesta(200, { estado: "listo", propuesta: propuestaOk }));

    await llamar({ instruccion: "  que cuadre  ", expectativas: { totalOt: 21, importeTotal: 27905.25 } });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({
      requestId: REQUEST_ID,
      instruccion: "que cuadre",
      expectativas: { totalOt: 21, importeTotal: 27905.25 },
    });
  });

  it("no manda expectativas vacías", async () => {
    fetchMock
      .mockResolvedValueOnce(respuesta(202, iniciada))
      .mockResolvedValueOnce(respuesta(200, { estado: "listo", propuesta: propuestaOk }));
    await llamar({ expectativas: {} });
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({ requestId: REQUEST_ID });
  });

  it("un error de negocio al consultar llega con su código", async () => {
    fetchMock
      .mockResolvedValueOnce(respuesta(202, iniciada))
      .mockResolvedValueOnce(respuesta(422, { error: "RELECTURA_NO_CUADRA" }));
    await expect(llamar()).rejects.toMatchObject({ codigo: "RELECTURA_NO_CUADRA" });
  });

  it("un trabajo perdido (servidor reiniciado) se distingue de una OV inexistente", async () => {
    fetchMock
      .mockResolvedValueOnce(respuesta(202, iniciada))
      .mockResolvedValueOnce(respuesta(404, { error: "TRABAJO_NO_ENCONTRADO" }));
    await expect(llamar()).rejects.toMatchObject({ codigo: "TRABAJO_PERDIDO" });
  });

  it("tolera hasta 3 cortes de red seguidos mientras consulta, pero no más", async () => {
    fetchMock
      .mockResolvedValueOnce(respuesta(202, iniciada))
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(respuesta(200, { estado: "listo", propuesta: propuestaOk }));
    await expect(llamar()).resolves.toMatchObject({ propuestaId: "prop-1" });

    fetchMock.mockReset();
    fetchMock.mockResolvedValueOnce(respuesta(202, iniciada));
    for (let i = 0; i < 4; i += 1) fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    await expect(llamar()).rejects.toMatchObject({ codigo: "RED" });
  });

  it("agota la espera con un mensaje claro", async () => {
    fetchMock
      .mockResolvedValueOnce(respuesta(202, iniciada))
      .mockResolvedValue(respuesta(200, { estado: "procesando" }));
    await expect(llamar({ esperaMaximaMs: -1 })).rejects.toMatchObject({ codigo: "TIEMPO_AGOTADO" });
  });

  it("una cancelación durante la espera se relanza como AbortError", async () => {
    fetchMock.mockResolvedValueOnce(respuesta(202, iniciada));
    const cancelar = vi.fn().mockRejectedValue(new DOMException("cancelado", "AbortError"));
    await expect(llamar({ esperar: cancelar })).rejects.toMatchObject({ name: "AbortError" });
  });

  it("rechaza respuestas con forma inesperada o de otra solicitud", async () => {
    fetchMock.mockResolvedValueOnce(respuesta(202, { requestId: REQUEST_ID }));
    await expect(llamar()).rejects.toMatchObject({ codigo: "RESPUESTA_INESPERADA" });

    fetchMock.mockReset();
    fetchMock
      .mockResolvedValueOnce(respuesta(202, iniciada))
      .mockResolvedValueOnce(respuesta(200, { estado: "listo", propuesta: { ...propuestaOk, requestId: "otra" } }));
    await expect(llamar()).rejects.toMatchObject({ codigo: "RESPUESTA_INESPERADA" });

    fetchMock.mockReset();
    fetchMock
      .mockResolvedValueOnce(respuesta(202, iniciada))
      .mockResolvedValueOnce(respuesta(200, { estado: "listo", propuesta: { hola: 1 } }));
    await expect(llamar()).rejects.toMatchObject({ codigo: "RESPUESTA_INESPERADA" });
  });

  it.each([
    [401, {}, "SESION"],
    [403, {}, "SIN_PERMISO"],
    [404, {}, "NO_ENCONTRADA"],
    [409, { error: "OC_REPETIDA" }, "OC_REPETIDA"],
    [422, { error: "SIN_ADJUNTOS_ORIGINALES" }, "SIN_ADJUNTOS_ORIGINALES"],
    [422, { error: "ADJUNTOS_NO_DISPONIBLES" }, "ADJUNTOS_NO_DISPONIBLES"],
    [429, {}, "LIMITE_SOLICITUDES"],
    [502, { error: "PROVEEDOR_IA" }, "PROVEEDOR_IA"],
    [503, { error: "DEMASIADOS_TRABAJOS" }, "SERVIDOR_OCUPADO"],
    [400, {}, "SOLICITUD_INVALIDA"],
    [500, {}, "SERVIDOR"],
  ])("al iniciar: HTTP %s %j → %s", async (status, cuerpo, codigo) => {
    fetchMock.mockResolvedValue(respuesta(status, cuerpo));
    const error = await llamar().catch((e) => e);
    expect(error).toBeInstanceOf(CorreccionCorreoApiError);
    expect(error.codigo).toBe(codigo);
  });

  it("no filtra el mensaje crudo del servidor al usuario", async () => {
    fetchMock.mockResolvedValue(respuesta(500, { message: "password authentication failed for user postgres" }));
    const error = await llamar().catch((e) => e);
    expect(error.message).not.toContain("password");
  });

  it("un fallo de red al iniciar es RED", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    await expect(llamar()).rejects.toMatchObject({ codigo: "RED" });
  });
});
