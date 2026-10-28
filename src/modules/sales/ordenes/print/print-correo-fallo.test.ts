import { describe, expect, it } from "vitest";
import {
  TIPO_CORREO_NO_ENVIADO,
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
  it("el reintento fallido se ve antes de que recargue la lista", () => {
    expect(
      mergeCorreoNoEnviado({
        servidor: new Set(),
        marcados: new Set(["ov-1"]),
        quitados: new Set(),
      }),
    ).toEqual(new Set(["ov-1"]));
  });

  it("un envío exitoso apaga la marca aunque el servidor aún la traiga", () => {
    expect(
      mergeCorreoNoEnviado({
        servidor: new Set(["ov-1"]),
        marcados: new Set(),
        quitados: new Set(["ov-1"]),
      }),
    ).toEqual(new Set());
  });
});
