import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useCierreCapturaOv, useFolioDesdeLista } from "./aviso-direccion-ov";

const cierreBase = {
  pendingDraftSaveAfterReorgRef: { current: false },
  reagruparAplicada: null,
  step: "start",
  isSaving: false,
  isLoading: false,
  submitIntentRef: { current: "emit" },
  handleSubmit: vi.fn(),
  startMode: null,
  origenTexto: "",
  origenArchivoFiles: [],
  productos: [{ idProducto: "p1" }],
  isReadingIa: false,
  origenAdjuntos: [],
  open: false,
  picker: null,
  isCompradorCreateOpen: false,
  confirmDiscrepanciasOpen: false,
  confirmSaveOpen: false,
  confirmDiscardOpen: false,
  isEditing: false,
  setConfirmDiscardOpen: vi.fn(),
  onClose: vi.fn(),
  previewHijas: [],
  setStep: vi.fn(),
  setError: vi.fn(),
  setStartMode: vi.fn(),
  ordenesTrabajoForm: [],
  setOrigenArchivoFiles: vi.fn(),
};

describe("useFolioDesdeLista", () => {
  it("copia el folio de la lista solo si el campo sigue vacío", () => {
    const setEditingCodigo = vi.fn();
    renderHook(() => useFolioDesdeLista({ codigoVenta: " OV-9 ", setEditingCodigo }));
    const updater = setEditingCodigo.mock.calls[0][0] as (prev: string) => string;
    expect(updater("")).toBe("OV-9");
    expect(updater("OV-1")).toBe("OV-1");
  });

  it("sin folio de lista no toca el campo", () => {
    const setEditingCodigo = vi.fn();
    renderHook(() => useFolioDesdeLista({ codigoVenta: "  ", setEditingCodigo }));
    expect(setEditingCodigo).not.toHaveBeenCalled();
  });
});

describe("useCierreCapturaOv", () => {
  it("los documentos están listos solo con texto o archivo, catálogo y sin lectura en curso", () => {
    const { result, rerender } = renderHook(
      (props) => useCierreCapturaOv(props),
      { initialProps: { ...cierreBase, origenTexto: "10 kg", startMode: "docs" } },
    );
    expect(result.current.docsHasContent).toBe(true);
    expect(result.current.docsReady).toBe(true);
    expect(result.current.formDescription).toBe(
      "Desde mensaje o archivos · revisa y completa el pedido",
    );

    rerender({ ...cierreBase, origenTexto: "10 kg", isReadingIa: true, startMode: "docs" });
    expect(result.current.docsReady).toBe(false);
  });
});
