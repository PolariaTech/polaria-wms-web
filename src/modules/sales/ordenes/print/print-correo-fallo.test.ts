import { describe, expect, it } from "vitest";
import {
  TIPO_CORREO_NO_ENVIADO,
  VIGENCIA_MARCA_LOCAL_MS,
  esErrorDeVersionVieja,
  idsConCorreoNoEnviado,
  mergeCorreoNoEnviado,
} from "./print-correo-fallo";

describe("idsConCorreoNoEnviado", () => {
  it("marca la orden si el último evento es el correo no enviado", () => {
    expect(
      idsConCorreoNoEnviado([
        {
          idOrdenVenta: "ov-1",
          tipo: "impresion_pdf",
          createdAt: "2026-10-27T10:00:00.000Z",
        },
        {
          idOrdenVenta: "ov-1",
          tipo: TIPO_CORREO_NO_ENVIADO,
          createdAt: "2026-10-27T11:00:00.000Z",
        },
      ]),
    ).toEqual(new Set(["ov-1"]));
  });

  it("un envío posterior quita la marca", () => {
    expect(
      idsConCorreoNoEnviado([
        {
          idOrdenVenta: "ov-1",
          tipo: TIPO_CORREO_NO_ENVIADO,
          createdAt: "2026-10-27T10:00:00.000Z",
        },
        {
          idOrdenVenta: "ov-1",
          tipo: "impresion_pdf_auto",
          createdAt: "2026-10-27T12:00:00.000Z",
        },
      ]),
    ).toEqual(new Set());
  });
});

describe("mergeCorreoNoEnviado", () => {
  const AHORA = 1_000_000;
  const RECIENTE = AHORA - 1_000;
  const VIEJA = AHORA - VIGENCIA_MARCA_LOCAL_MS - 1;

  it("el reintento fallido se ve antes de que recargue la lista", () => {
    expect(
      mergeCorreoNoEnviado({
        servidor: new Set(),
        marcados: new Map([["ov-1", RECIENTE]]),
        quitados: new Map(),
        ahora: AHORA,
      }),
    ).toEqual(new Set(["ov-1"]));
  });

  it("un envío exitoso apaga la marca aunque el servidor aún la traiga", () => {
    expect(
      mergeCorreoNoEnviado({
        servidor: new Set(["ov-1"]),
        marcados: new Map(),
        quitados: new Map([["ov-1", RECIENTE]]),
        ahora: AHORA,
      }),
    ).toEqual(new Set());
  });

  it("REQ-189: una marca vieja no mantiene la alerta si otro usuario ya imprimió", () => {
    expect(
      mergeCorreoNoEnviado({
        servidor: new Set(),
        marcados: new Map([["ov-1", VIEJA]]),
        quitados: new Map(),
        ahora: AHORA,
      }),
    ).toEqual(new Set());
  });

  it("REQ-189: un 'quitado' viejo no oculta un fallo que el servidor ya trae", () => {
    expect(
      mergeCorreoNoEnviado({
        servidor: new Set(["ov-1"]),
        marcados: new Map(),
        quitados: new Map([["ov-1", VIEJA]]),
        ahora: AHORA,
      }),
    ).toEqual(new Set(["ov-1"]));
  });

  it("solo expiran las marcas viejas; las recientes de otras OV siguen", () => {
    expect(
      mergeCorreoNoEnviado({
        servidor: new Set(),
        marcados: new Map([
          ["ov-1", VIEJA],
          ["ov-2", RECIENTE],
        ]),
        quitados: new Map(),
        ahora: AHORA,
      }),
    ).toEqual(new Set(["ov-2"]));
  });
});

describe("esErrorDeVersionVieja", () => {
  it("reconoce el ChunkLoadError por su nombre", () => {
    const error = new Error("falló");
    error.name = "ChunkLoadError";
    expect(esErrorDeVersionVieja(error)).toBe(true);
  });

  it("reconoce el mensaje real de REQ-189 (Turbopack)", () => {
    expect(
      esErrorDeVersionVieja(
        new Error(
          "Failed to load chunk /_next/static/chunks/3nh_1uou5_t_9.js from module 578620",
        ),
      ),
    ).toBe(true);
  });

  it("reconoce el mensaje de webpack y el de import dinámico", () => {
    expect(esErrorDeVersionVieja(new Error("Loading chunk 412 failed."))).toBe(
      true,
    );
    expect(
      esErrorDeVersionVieja(
        new TypeError("Failed to fetch dynamically imported module: /x.js"),
      ),
    ).toBe(true);
  });

  it("acepta el mensaje como texto (resultado de la autoimpresión)", () => {
    expect(
      esErrorDeVersionVieja("Failed to load chunk /_next/static/chunks/a.js"),
    ).toBe(true);
  });

  it("no confunde otros fallos de impresión con una versión vieja", () => {
    expect(
      esErrorDeVersionVieja(new Error("No hay conexión con QZ Tray.")),
    ).toBe(false);
    expect(esErrorDeVersionVieja("No se pudo enviar el PDF por correo.")).toBe(
      false,
    );
    expect(esErrorDeVersionVieja(null)).toBe(false);
    expect(esErrorDeVersionVieja(undefined)).toBe(false);
  });
});
