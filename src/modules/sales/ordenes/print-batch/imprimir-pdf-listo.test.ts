import { beforeEach, describe, expect, it, vi } from "vitest";

const imprimir = vi.fn();
vi.mock("../print/print-silent-cuenta", () => ({
  printPdfSilentToCuenta: (...args: unknown[]) => imprimir(...args),
}));

import { imprimirPdfListo } from "./imprimir-pdf-listo";

beforeEach(() => {
  vi.clearAllMocks();
  imprimir.mockResolvedValue({ via: "email", impresora: "Brother", queue: { kind: "unknown" } });
});

describe("imprimirPdfListo", () => {
  it("manda el PDF en base64 a la impresora de la cuenta con el nombre del trabajo", async () => {
    const pdf = new Blob(["%PDF-1.4 hola"], { type: "application/pdf" });

    const resultado = await imprimirPdfListo(pdf, { codigoCuenta: "JBR", nombreTrabajo: "OV OV-1 (2/5)" });

    expect(imprimir).toHaveBeenCalledTimes(1);
    const enviado = imprimir.mock.calls[0]![0];
    expect(enviado.codigoCuenta).toBe("JBR");
    expect(enviado.jobName).toBe("OV OV-1 (2/5)");
    expect(atob(enviado.pdfBase64)).toBe("%PDF-1.4 hola");
    expect(resultado.impresora).toBe("Brother");
  });

  it("un PDF vacío falla antes de tocar la impresora", async () => {
    await expect(imprimirPdfListo(new Blob([]), { codigoCuenta: "JBR", nombreTrabajo: "x" })).rejects.toThrow(
      "No se pudo generar el PDF para imprimir.",
    );
    expect(imprimir).not.toHaveBeenCalled();
  });

  it("si la impresora falla, el error llega tal cual", async () => {
    imprimir.mockRejectedValue(new Error("No hay impresora configurada."));

    await expect(imprimirPdfListo(new Blob(["x"]), { codigoCuenta: "JBR", nombreTrabajo: "x" })).rejects.toThrow(
      "No hay impresora configurada.",
    );
  });
});
