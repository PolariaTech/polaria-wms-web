import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  toDataURL: vi.fn(),
  save: vi.fn(),
  render: vi.fn(),
  origin: vi.fn(),
}));

vi.mock("qrcode", () => ({ default: { toDataURL: mocks.toDataURL } }));
vi.mock("@/modules/sales/ordenes/print/resolve-captura-orden-origin", () => ({
  resolveCapturaOrdenOrigin: mocks.origin,
}));
vi.mock("./despacho-qr-pdf", () => ({
  urlDespachoConCuenta: (origin: string, cuenta: string) => `${origin}/despacho?cuenta=${cuenta}`,
  formatearFechaDespacho: (_fecha: Date, zona?: string) => `fecha-${zona}`,
  renderDespachoQrPdf: mocks.render,
}));

import { CodigoDespachoError, guardarPdfCodigoDespacho } from "./guardar-pdf-codigo-despacho";

describe("guardarPdfCodigoDespacho (REQ-306)", () => {
  beforeEach(() => {
    mocks.toDataURL.mockReset().mockResolvedValue("data:image/png;base64,QR");
    mocks.save.mockReset();
    mocks.render.mockReset().mockReturnValue({ save: mocks.save });
    mocks.origin.mockReset().mockReturnValue("https://wms.ejemplo.co");
  });

  it("arma el QR con el origen vigente y la cuenta, y descarga despachos.pdf con la fecha de Colombia", async () => {
    await guardarPdfCodigoDespacho("  1YW43 ");

    expect(mocks.toDataURL).toHaveBeenCalledWith(
      "https://wms.ejemplo.co/despacho?cuenta=1YW43",
      expect.objectContaining({ errorCorrectionLevel: "M" }),
    );
    expect(mocks.render).toHaveBeenCalledWith({
      fecha: "fecha-America/Bogota",
      qrDataUrl: "data:image/png;base64,QR",
    });
    expect(mocks.save).toHaveBeenCalledWith("despachos.pdf");
  });

  it("sin cuenta activa avisa y no genera nada", async () => {
    await expect(guardarPdfCodigoDespacho("   ")).rejects.toThrow(CodigoDespachoError);
    expect(mocks.toDataURL).not.toHaveBeenCalled();
  });

  it("sin un origen válido (por ejemplo un preview) no genera un QR que no abriría", async () => {
    mocks.origin.mockReturnValue("");

    await expect(guardarPdfCodigoDespacho("1YW43")).rejects.toThrow(/dirección oficial/);
    expect(mocks.toDataURL).not.toHaveBeenCalled();
  });

  it("si falla el QR o el PDF devuelve un mensaje claro, sin detalles técnicos", async () => {
    mocks.toDataURL.mockRejectedValue(new Error("canvas roto"));

    await expect(guardarPdfCodigoDespacho("1YW43")).rejects.toThrow(
      "No se pudo generar el PDF. Inténtalo de nuevo.",
    );
    expect(mocks.save).not.toHaveBeenCalled();
  });
});
