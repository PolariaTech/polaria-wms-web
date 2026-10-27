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
  ReagrupacionApiError,
  solicitarPropuestaReagrupacion,
} from "./reagrupar-ot.client";

const REQUEST_ID = "770e8400-e29b-41d4-a716-446655440002";
const ID_OV = "550e8400-e29b-41d4-a716-446655440000";

const estadoBase = {
  ots: [
    {
      otId: "ot-1",
      etiqueta: "PO-1 — COMEDOR",
      almacen: "COMEDOR",
      numeroPedido: "PO-1",
      renglones: [{ renglonId: "renglon-0-0", producto: "AGUACATE", cantidad: 25 }],
    },
  ],
};

function parametros(extra: Partial<Parameters<typeof solicitarPropuestaReagrupacion>[0]> = {}) {
  return {
    idOrdenVenta: ID_OV,
    requestId: REQUEST_ID,
    instruccion: "Separa el aguacate",
    historial: ["primera"],
    estadoBase,
    ...extra,
  };
}

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
  ots: [{ otId: "ot-1", nuevaClave: null, etiquetaSugerida: null, renglonIds: ["renglon-0-0"] }],
  resumen: { antes: 1, despues: 1, nuevas: 0, vacias: 0 },
  movimientos: [],
};

describe("solicitarPropuestaReagrupacion", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("hace POST al endpoint de la OV con JWT, tenant y el cuerpo esperado (sin codigoCuenta)", async () => {
    fetchMock.mockResolvedValue(respuesta(200, propuestaOk));

    await solicitarPropuestaReagrupacion(parametros());

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      `/api/ventas/ordenes/${ID_OV}/ordenes-trabajo/propuesta-reagrupacion`,
    );
    expect(init.method).toBe("POST");
    const headers = init.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer token-de-prueba");
    expect(headers.get("X-Codigo-Empresa")).toBe("EMP001");

    const cuerpo = JSON.parse(init.body as string);
    expect(cuerpo).toEqual({
      requestId: REQUEST_ID,
      instruccion: "Separa el aguacate",
      historial: [{ instruccion: "primera" }],
      estadoBase,
    });
    expect(cuerpo).not.toHaveProperty("codigoCuenta");
  });

  it("devuelve una propuesta", async () => {
    fetchMock.mockResolvedValue(respuesta(200, propuestaOk));

    const res = await solicitarPropuestaReagrupacion(parametros());

    expect(res.tipo).toBe("propuesta");
    if (res.tipo === "propuesta") {
      expect(res.propuesta.resumen).toEqual({ antes: 1, despues: 1, nuevas: 0, vacias: 0 });
    }
  });

  it("devuelve aclaración y rechazo", async () => {
    fetchMock.mockResolvedValueOnce(
      respuesta(200, { requestId: REQUEST_ID, aclaracion: "No quedó claro." }),
    );
    expect(await solicitarPropuestaReagrupacion(parametros())).toEqual({
      tipo: "aclaracion",
      mensaje: "No quedó claro.",
    });

    fetchMock.mockResolvedValueOnce(
      respuesta(200, { requestId: REQUEST_ID, rechazo: "FUERA_DE_ALCANCE" }),
    );
    expect(await solicitarPropuestaReagrupacion(parametros())).toEqual({
      tipo: "rechazo",
    });
  });

  it.each([
    [401, {}, "SESION"],
    [403, {}, "SIN_PERMISO"],
    [404, {}, "NO_ENCONTRADA"],
    [409, { error: "OV_ESTADO_CAMBIO" }, "OV_ESTADO_CAMBIO"],
    [400, { error: "ESTADO_BASE_INVALIDO" }, "ESTADO_BASE_INVALIDO"],
    [400, { error: "Bad Request" }, "SOLICITUD_INVALIDA"],
    [422, { error: "PROPUESTA_INVALIDA" }, "PROPUESTA_INVALIDA"],
    [429, {}, "LIMITE_SOLICITUDES"],
    [502, { error: "PROVEEDOR_IA" }, "PROVEEDOR_IA"],
    [500, { error: "BASE_DATOS" }, "SERVIDOR"],
  ])("HTTP %i %j se traduce al código %s con un mensaje en español", async (status, cuerpo, codigo) => {
    fetchMock.mockResolvedValue(respuesta(status, cuerpo));

    const error = await solicitarPropuestaReagrupacion(parametros()).catch(
      (causa) => causa,
    );

    expect(error).toBeInstanceOf(ReagrupacionApiError);
    expect(error.codigo).toBe(codigo);
    expect(error.status).toBe(status);
    expect(error.message).toMatch(/[a-záéíóú]/i);
  });

  it("el 422 no se muestra como 'código de empresa' (mensaje del helper genérico)", async () => {
    fetchMock.mockResolvedValue(respuesta(422, { error: "PROPUESTA_INVALIDA" }));

    const error = await solicitarPropuestaReagrupacion(parametros()).catch(
      (causa) => causa,
    );

    expect(error.message).not.toMatch(/código de empresa/i);
    expect(error.message).toMatch(/propuesta válida/i);
  });

  it("un fallo de red responde RED; una cancelación se propaga como AbortError", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    const errorRed = await solicitarPropuestaReagrupacion(parametros()).catch(
      (causa) => causa,
    );
    expect(errorRed).toBeInstanceOf(ReagrupacionApiError);
    expect(errorRed.codigo).toBe("RED");

    fetchMock.mockRejectedValueOnce(new DOMException("cancelada", "AbortError"));
    const errorCancelacion = await solicitarPropuestaReagrupacion(
      parametros(),
    ).catch((causa) => causa);
    expect(errorCancelacion).toBeInstanceOf(DOMException);
    expect(errorCancelacion.name).toBe("AbortError");
  });

  it("pasa el AbortSignal a fetch", async () => {
    fetchMock.mockResolvedValue(respuesta(200, propuestaOk));
    const controlador = new AbortController();

    await solicitarPropuestaReagrupacion(parametros({ signal: controlador.signal }));

    expect((fetchMock.mock.calls[0][1] as RequestInit).signal).toBe(controlador.signal);
  });

  it("rechaza una respuesta cuyo requestId no corresponde (respuesta de otra solicitud)", async () => {
    fetchMock.mockResolvedValue(
      respuesta(200, { ...propuestaOk, requestId: "otro-request" }),
    );

    const error = await solicitarPropuestaReagrupacion(parametros()).catch(
      (causa) => causa,
    );

    expect(error.codigo).toBe("RESPUESTA_INESPERADA");
  });

  it("rechaza una respuesta 200 con formato inesperado", async () => {
    fetchMock.mockResolvedValue(respuesta(200, { requestId: REQUEST_ID, algo: 1 }));

    const error = await solicitarPropuestaReagrupacion(parametros()).catch(
      (causa) => causa,
    );

    expect(error.codigo).toBe("RESPUESTA_INESPERADA");
  });
});
