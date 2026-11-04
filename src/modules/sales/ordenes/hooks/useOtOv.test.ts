import { describe, expect, it, vi } from "vitest";
import { abrirFormularioDesdeDocs } from "./useOtOv";

describe("abrirFormularioDesdeDocs", () => {
  it("sin cuenta avisa y no llama a Mateo", async () => {
    const setError = vi.fn();
    const setIsReadingIa = vi.fn();
    const ensureFormDataReady = vi.fn();

    await abrirFormularioDesdeDocs({
      codigoCuenta: "",
      origenTexto: "pedido",
      origenArchivoFiles: [],
      setError,
      setIsReadingIa,
      ensureFormDataReady,
    });

    expect(setError).toHaveBeenCalledWith("No hay cuenta activa.");
    expect(setIsReadingIa).not.toHaveBeenCalled();
    expect(ensureFormDataReady).not.toHaveBeenCalled();
  });

  it("sin texto ni archivos pide el pedido antes de leer", async () => {
    const setError = vi.fn();
    const ensureFormDataReady = vi.fn();

    await abrirFormularioDesdeDocs({
      codigoCuenta: "demo",
      origenTexto: "   ",
      origenArchivoFiles: [],
      setError,
      ensureFormDataReady,
    });

    expect(setError).toHaveBeenCalledWith(
      "Pega el texto del pedido o adjunta al menos un archivo.",
    );
    expect(ensureFormDataReady).not.toHaveBeenCalled();
  });

  it("si el catálogo no está listo no empieza a leer", async () => {
    const setIsReadingIa = vi.fn();
    const ensureFormDataReady = vi.fn().mockResolvedValue(false);

    await abrirFormularioDesdeDocs({
      codigoCuenta: "demo",
      origenTexto: "10 kg de aguacate",
      origenArchivoFiles: [],
      setError: vi.fn(),
      setIsReadingIa,
      ensureFormDataReady,
    });

    expect(ensureFormDataReady).toHaveBeenCalledOnce();
    expect(setIsReadingIa).not.toHaveBeenCalled();
  });
});
