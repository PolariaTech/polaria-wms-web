import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  toDataURL: vi.fn(),
  output: vi.fn(),
  render: vi.fn(),
  origin: vi.fn(),
  imprimirPdfListo: vi.fn(),
}));

vi.mock("qrcode", () => ({ default: { toDataURL: mocks.toDataURL } }));
vi.mock("@/modules/sales/ordenes/print/resolve-captura-orden-origin", () => ({
  resolveCapturaOrdenOrigin: mocks.origin,
}));
vi.mock("@/modules/sales/ordenes/print-batch/imprimir-pdf-listo", () => ({
  imprimirPdfListo: mocks.imprimirPdfListo,
}));
vi.mock("./despacho-qr-pdf", () => ({
  urlDespachoConCuenta: (origin: string, cuenta: string) => `${origin}/despacho?cuenta=${cuenta}`,
  formatearFechaDespacho: (_fecha: Date, zona?: string) => `fecha-${zona}`,
  renderDespachoQrPdf: mocks.render,
}));

import {
  CodigoDespachoError,
  imprimirCodigoDespacho,
  prepararCodigoDespacho,
} from "./imprimir-codigo-despacho";

const PDF = new Blob(["pdf"], { type: "application/pdf" });
const ENVIADO = { via: "ipp", impresora: "Epson", queue: { kind: "unknown" } } as const;

describe("código de despacho: preparar e imprimir (REQ-306)", () => {
  beforeEach(() => {
    mocks.toDataURL.mockReset().mockResolvedValue("data:image/png;base64,QR");
    mocks.output.mockReset().mockReturnValue(PDF);
    mocks.render.mockReset().mockReturnValue({ output: mocks.output });
    mocks.origin.mockReset().mockReturnValue("https://wms.ejemplo.co");
    mocks.imprimirPdfListo.mockReset().mockResolvedValue(ENVIADO);
  });

  it("arma la hoja con el QR del origen vigente y la cuenta, con la fecha de Colombia", async () => {
    const pdf = await prepararCodigoDespacho("  1YW43 ");

    expect(mocks.toDataURL).toHaveBeenCalledWith(
      "https://wms.ejemplo.co/despacho?cuenta=1YW43",
      expect.objectContaining({ errorCorrectionLevel: "M" }),
    );
    expect(mocks.render).toHaveBeenCalledWith({
      fecha: "fecha-America/Bogota",
      qrDataUrl: "data:image/png;base64,QR",
    });
    expect(mocks.output).toHaveBeenCalledWith("blob");
    expect(pdf).toBe(PDF);
    expect(mocks.imprimirPdfListo).not.toHaveBeenCalled();
  });

  it("sin cuenta activa avisa y no genera nada", async () => {
    await expect(prepararCodigoDespacho("   ")).rejects.toThrow(CodigoDespachoError);
    expect(mocks.toDataURL).not.toHaveBeenCalled();
  });

  it("sin un origen válido (por ejemplo un preview) no arma un QR que no abriría", async () => {
    mocks.origin.mockReturnValue("");

    await expect(prepararCodigoDespacho("1YW43")).rejects.toThrow(/dirección oficial/);
    expect(mocks.toDataURL).not.toHaveBeenCalled();
  });

  it("si falla el QR devuelve un mensaje claro, sin detalles técnicos", async () => {
    mocks.toDataURL.mockRejectedValue(new Error("canvas roto"));

    await expect(prepararCodigoDespacho("1YW43")).rejects.toThrow(
      "No se pudo generar el PDF. Inténtalo de nuevo.",
    );
  });

  it("imprime exactamente la hoja de la vista previa en la impresora de la cuenta", async () => {
    const resultado = await imprimirCodigoDespacho(PDF, " 1YW43 ");

    expect(mocks.imprimirPdfListo).toHaveBeenCalledWith(PDF, {
      codigoCuenta: "1YW43",
      nombreTrabajo: "Código de despacho",
    });
    expect(resultado).toBe(ENVIADO);
    expect(mocks.render).not.toHaveBeenCalled();
  });

  it("si la impresora falla conserva su mensaje (ya dice qué hacer)", async () => {
    mocks.imprimirPdfListo.mockRejectedValue(new Error("No hay impresora configurada."));

    const error = await imprimirCodigoDespacho(PDF, "1YW43").catch((causa: unknown) => causa);
    expect(error).toBeInstanceOf(CodigoDespachoError);
    expect((error as Error).message).toBe("No hay impresora configurada.");
  });
});
