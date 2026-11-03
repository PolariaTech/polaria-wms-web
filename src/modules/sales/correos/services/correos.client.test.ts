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

import { FILTROS_CORREOS_VACIOS } from "../types/correos.types";
import {
  consultarIngreso,
  CorreosApiError,
  finDelDiaColombia,
  ingresarCorreo,
  inicioDelDiaColombia,
  leerIngreso,
  listarCorreos,
} from "./correos.client";

const MSG = "1a1a198510cde156";

function respuesta(status: number, cuerpo: unknown): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const ingresoOk = {
  messageId: MSG,
  estado: "ingresado",
  idOrdenVenta: "ov-uuid",
  codigoOrdenVenta: "OV-00001319",
  error: null,
};

describe("correos.client (REQ-104)", () => {
  let fetchMock: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchMock = vi.spyOn(globalThis, "fetch");
  });
  afterEach(() => {
    fetchMock.mockRestore();
  });

  describe("listarCorreos", () => {
    it("pide la página con los filtros, las fechas en hora de Colombia y las cabeceras de sesión", async () => {
      fetchMock.mockResolvedValue(
        respuesta(200, { total: 0, pagina: 2, tamano: 25, filas: [] }),
      );

      await listarCorreos({
        modo: "descartados",
        pagina: 2,
        tamano: 25,
        filtros: {
          remitente: "  hotel  ",
          asunto: "pedido",
          desde: "2026-11-01",
          hasta: "2026-11-03",
        },
      });

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      const consulta = new URL(url, "http://localhost").searchParams;
      expect(url.startsWith("/api/ventas/correos?")).toBe(true);
      expect(consulta.get("modo")).toBe("descartados");
      expect(consulta.get("pagina")).toBe("2");
      expect(consulta.get("tamano")).toBe("25");
      expect(consulta.get("remitente")).toBe("hotel");
      expect(consulta.get("asunto")).toBe("pedido");
      expect(consulta.get("desde")).toBe("2026-11-01T00:00:00.000-05:00");
      expect(consulta.get("hasta")).toBe("2026-11-03T23:59:59.999-05:00");
      const headers = new Headers(init.headers);
      expect(headers.get("Authorization")).toBe("Bearer token-de-prueba");
      expect(headers.get("X-Codigo-Empresa")).toBe("EMP001");
      expect(init.method).toBe("GET");
    });

    it("no manda los filtros vacíos", async () => {
      fetchMock.mockResolvedValue(respuesta(200, { total: 0, filas: [] }));
      await listarCorreos({
        modo: "todos",
        pagina: 1,
        tamano: 25,
        filtros: FILTROS_CORREOS_VACIOS,
      });
      const [url] = fetchMock.mock.calls[0] as [string];
      expect([...new URL(url, "http://localhost").searchParams.keys()].sort()).toEqual(
        ["modo", "pagina", "tamano"],
      );
    });

    it("lee las filas con su estado de ingreso y descarta las que no tienen messageId", async () => {
      fetchMock.mockResolvedValue(
        respuesta(200, {
          total: 40,
          pagina: 1,
          tamano: 25,
          filas: [
            {
              recibidoEn: "2026-11-03T13:27:51.000Z",
              de: "bss@x.com",
              para: null,
              asunto: "Orden de compra",
              messageId: MSG,
              hilo: MSG,
              adjunto: "PO.pdf",
              nuevoPedido: false,
              motivo: "cotización",
              ingreso: ingresoOk,
            },
            { asunto: "sin id" },
            { messageId: "abc123def", nuevoPedido: "no", ingreso: { estado: "raro" } },
          ],
        }),
      );

      const lista = await listarCorreos({
        modo: "todos",
        pagina: 1,
        tamano: 25,
        filtros: FILTROS_CORREOS_VACIOS,
      });

      expect(lista.total).toBe(40);
      expect(lista.filas).toHaveLength(2);
      expect(lista.filas[0]).toMatchObject({
        messageId: MSG,
        nuevoPedido: false,
        motivo: "cotización",
        ingreso: { estado: "ingresado", codigoOrdenVenta: "OV-00001319" },
      });
      expect(lista.filas[1]).toMatchObject({ nuevoPedido: null, ingreso: null });
    });

    it("rechaza una respuesta que no trae filas", async () => {
      fetchMock.mockResolvedValue(respuesta(200, { total: 1 }));
      await expect(
        listarCorreos({ modo: "todos", pagina: 1, tamano: 25, filtros: FILTROS_CORREOS_VACIOS }),
      ).rejects.toMatchObject({ codigo: "RESPUESTA_INESPERADA" });
    });

    it.each([
      [401, {}, "SESION"],
      [403, { error: "CORREOS_NO_DISPONIBLES" }, "CUENTA_NO_HABILITADA"],
      [403, { error: "Forbidden" }, "SIN_PERMISO"],
      [429, {}, "LIMITE_SOLICITUDES"],
      [502, { error: "N8N_NO_RESPONDE" }, "N8N"],
      [503, { error: "CORREOS_NO_CONFIGURADOS" }, "N8N"],
      [500, {}, "SERVIDOR"],
    ])("traduce el %i %j a %s", async (status, cuerpo, codigo) => {
      fetchMock.mockResolvedValue(respuesta(status, cuerpo));
      const intento = listarCorreos({
        modo: "todos",
        pagina: 1,
        tamano: 25,
        filtros: FILTROS_CORREOS_VACIOS,
      });
      await expect(intento).rejects.toBeInstanceOf(CorreosApiError);
      await expect(intento).rejects.toMatchObject({ codigo, status });
    });

    it("traduce un corte de red a RED y deja pasar la cancelación", async () => {
      fetchMock.mockRejectedValueOnce(new TypeError("fallo"));
      await expect(
        listarCorreos({ modo: "todos", pagina: 1, tamano: 25, filtros: FILTROS_CORREOS_VACIOS }),
      ).rejects.toMatchObject({ codigo: "RED" });

      fetchMock.mockRejectedValueOnce(new DOMException("cancelado", "AbortError"));
      await expect(
        listarCorreos({ modo: "todos", pagina: 1, tamano: 25, filtros: FILTROS_CORREOS_VACIOS }),
      ).rejects.toMatchObject({ name: "AbortError" });
    });
  });

  describe("ingresarCorreo", () => {
    it("hace POST al correo y devuelve el estado", async () => {
      fetchMock.mockResolvedValue(
        respuesta(202, { ...ingresoOk, estado: "procesando", codigoOrdenVenta: null }),
      );

      const ingreso = await ingresarCorreo(MSG);

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`/api/ventas/correos/${MSG}/ingresar`);
      expect(init.method).toBe("POST");
      expect(ingreso.estado).toBe("procesando");
    });

    it("el 409 de «ya ingresado» llega con su propio código y el mensaje del api", async () => {
      fetchMock.mockResolvedValue(
        respuesta(409, {
          statusCode: 409,
          error: "CORREO_YA_INGRESADO",
          message: "Este pedido ya fue ingresado como OV-00001318.",
        }),
      );
      await expect(ingresarCorreo(MSG)).rejects.toMatchObject({
        codigo: "YA_INGRESADO",
        message: "Este pedido ya fue ingresado como OV-00001318.",
      });
    });

    it("un 409 distinto no se toma por «ya ingresado»", async () => {
      fetchMock.mockResolvedValue(respuesta(409, { error: "Conflict" }));
      await expect(ingresarCorreo(MSG)).rejects.toMatchObject({ codigo: "SERVIDOR" });
    });
  });

  describe("consultarIngreso", () => {
    it("lee el avance del correo", async () => {
      fetchMock.mockResolvedValue(respuesta(200, ingresoOk));
      const ingreso = await consultarIngreso(MSG);
      expect((fetchMock.mock.calls[0] as [string])[0]).toBe(
        `/api/ventas/correos/${MSG}/ingreso`,
      );
      expect(ingreso).toEqual(ingresoOk);
    });

    it("el 404 significa que nunca se intentó ingresar", async () => {
      fetchMock.mockResolvedValue(respuesta(404, { error: "INGRESO_NO_ENCONTRADO" }));
      await expect(consultarIngreso(MSG)).rejects.toMatchObject({ codigo: "NO_ENCONTRADO" });
    });
  });

  describe("utilidades", () => {
    it("leerIngreso solo acepta los tres estados conocidos", () => {
      expect(leerIngreso({ messageId: MSG, estado: "error", error: "x" })).toMatchObject({
        estado: "error",
        error: "x",
      });
      expect(leerIngreso({ messageId: MSG, estado: "otro" })).toBeNull();
      expect(leerIngreso({ estado: "ingresado" })).toBeNull();
      expect(leerIngreso(null)).toBeNull();
    });

    it("los límites del día son los de Colombia (UTC-5)", () => {
      expect(inicioDelDiaColombia("2026-11-03")).toBe("2026-11-03T00:00:00.000-05:00");
      expect(finDelDiaColombia("2026-11-03")).toBe("2026-11-03T23:59:59.999-05:00");
    });
  });
});
