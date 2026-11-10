import { describe, expect, it } from "vitest";
import {
  buildAvisoTotalSolicitudVsOv,
  extractTotalSolicitudFromTexto,
  extractTotalSolicitudFromTextos,
  parseMontoSolicitud,
  textosDesdeArchivosExtraidos,
} from "./total-solicitud-vs-ov";

describe("parseMontoSolicitud", () => {
  it("lee montos con coma decimal MX", () => {
    expect(parseMontoSolicitud("1.234,56")).toBe(1234.56);
  });

  it("lee montos con punto decimal", () => {
    expect(parseMontoSolicitud("1234.56")).toBe(1234.56);
  });
});

describe("extractTotalSolicitudFromTexto", () => {
  it("saca TOTAL: del cuerpo", () => {
    expect(
      extractTotalSolicitudFromTexto(
        "Productos varios\nTOTAL: $11,500.60\nGracias",
      ),
    ).toBe(11500.6);
  });

  it("sin total explícito deja null", () => {
    expect(extractTotalSolicitudFromTexto("Solo lista de kilos")).toBeNull();
  });
});

describe("extractTotalSolicitudFromTextos", () => {
  it("REQ-279: si el cuerpo no trae total, lo saca del adjunto", () => {
    expect(
      extractTotalSolicitudFromTextos([
        "Buenas, adjunto la OC",
        "PO Waldorf\nTOTAL: $2,450.00\nItems…",
      ]),
    ).toBe(2450);
  });

  it("prioriza el primer texto con total (cuerpo antes que adjunto)", () => {
    expect(
      extractTotalSolicitudFromTextos([
        "TOTAL: $100.00",
        "TOTAL: $999.00",
      ]),
    ).toBe(100);
  });
});

describe("textosDesdeArchivosExtraidos", () => {
  it("solo toma archivos tipo texto con contenido", () => {
    expect(
      textosDesdeArchivosExtraidos([
        { tipo: "texto", contenido: "TOTAL: $1" },
        { tipo: "imagen", contenido: "no" },
        { tipo: "texto", contenido: "  " },
        { tipo: "texto", contenido: "hola" },
      ]),
    ).toEqual(["TOTAL: $1", "hola"]);
  });
});

describe("buildAvisoTotalSolicitudVsOv", () => {
  it("REQ-279: avisa si OV y solicitud no cuadran", () => {
    const aviso = buildAvisoTotalSolicitudVsOv({
      totalOv: 100,
      totalSolicitud: 150,
    });
    expect(aviso?.fieldKey).toBe("totalSolicitud");
    expect(aviso?.campo).toBe("Total");
    expect(aviso?.ia).toMatch(/no cuadra/i);
  });

  it("no avisa si cuadra dentro de tolerancia", () => {
    expect(
      buildAvisoTotalSolicitudVsOv({
        totalOv: 100,
        totalSolicitud: 100.02,
      }),
    ).toBeNull();
  });

  it("sin total de solicitud no avisa", () => {
    expect(
      buildAvisoTotalSolicitudVsOv({
        totalOv: 100,
        totalSolicitud: null,
      }),
    ).toBeNull();
  });
});
