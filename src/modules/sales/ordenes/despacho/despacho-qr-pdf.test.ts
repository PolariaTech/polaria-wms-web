import { describe, expect, it } from "vitest";
import {
  formatearFechaDespacho,
  medidasHojaDespachoQr,
  renderDespachoQrPdf,
  urlDespachoConCuenta,
} from "./despacho-qr-pdf";

describe("urlDespachoConCuenta", () => {
  it("apunta el QR a la cuenta de la sesión", () => {
    expect(urlDespachoConCuenta("http://localhost:3001/", "023WA")).toBe(
      "http://localhost:3001/despacho?cuenta=023WA",
    );
  });
});

describe("medidasHojaDespachoQr", () => {
  it("deja la fecha a la izquierda, DESPACHOS a la derecha y el QR grande al centro", () => {
    const medidas = medidasHojaDespachoQr();
    expect(medidas.fecha.x).toBeLessThan(medidas.ancho / 2);
    expect(medidas.titulo.x).toBeGreaterThan(medidas.ancho / 2);
    expect(medidas.qr.size).toBeGreaterThanOrEqual(140);
    expect(medidas.qr.x).toBeCloseTo((medidas.ancho - medidas.qr.size) / 2);
    expect(medidas.qr.y + medidas.qr.size).toBeLessThan(medidas.alto);
  });
});

describe("formatearFechaDespacho", () => {
  it("escribe la fecha en español", () => {
    expect(
      formatearFechaDespacho(new Date("2026-11-10T18:00:00Z")),
    ).toBe("10 de noviembre de 2026");
  });
});

describe("renderDespachoQrPdf", () => {
  it("arma una hoja carta", () => {
    const doc = renderDespachoQrPdf({
      fecha: "10 de noviembre de 2026",
      qrDataUrl: "",
    });
    expect(doc.getNumberOfPages()).toBe(1);
  });
});
