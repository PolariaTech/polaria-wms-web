import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { importCatalogoProductosFromFile } = vi.hoisted(() => ({
  importCatalogoProductosFromFile: vi.fn(),
}));

vi.mock("../services/productos-catalogo.service", () => ({
  importCatalogoProductosFromFile,
}));

import { useCatalogoImportExcel } from "./use-catalogo-import-excel";

function setup(codigoCuenta: string | null = "MIT00") {
  const click = vi.fn();
  const reload = vi.fn().mockResolvedValue(undefined);
  const fileInputRef = { current: { click } as unknown as HTMLInputElement };
  const hook = renderHook(() =>
    useCatalogoImportExcel({ codigoCuenta, fileInputRef, reload }),
  );
  return { ...hook, click, reload };
}

describe("useCatalogoImportExcel", () => {
  beforeEach(() => {
    importCatalogoProductosFromFile.mockReset();
  });

  it("abre el selector de archivo al importar", () => {
    const { result, click } = setup();
    act(() => result.current.handleImportExcel());
    expect(click).toHaveBeenCalledTimes(1);
  });

  it("no hace nada sin cuenta", () => {
    const { result, click } = setup(null);
    act(() => result.current.handleImportExcel());
    expect(click).not.toHaveBeenCalled();
  });

  it("importa, recarga y resume el resultado", async () => {
    importCatalogoProductosFromFile.mockResolvedValue({
      imported: 2,
      skipped: 1,
      errors: [],
    });
    const { result, reload } = setup();

    await act(async () => {
      await result.current.handleFileSelected(new File(["x"], "p.xlsx"));
    });

    expect(reload).toHaveBeenCalledTimes(1);
    expect(result.current.importMessage).toContain("Se importaron 2 producto(s) desde p.xlsx.");
    expect(result.current.importMessage).toContain("1 fila(s) omitida(s)");
    expect(result.current.importError).toBeNull();
    expect(result.current.isImporting).toBe(false);
  });

  it("reporta error cuando la importación falla", async () => {
    importCatalogoProductosFromFile.mockRejectedValue(new Error("boom"));
    const { result } = setup();

    await act(async () => {
      await result.current.handleFileSelected(new File(["x"], "p.xlsx"));
    });

    expect(result.current.importError).toBe("boom");
  });

  it("avisa cuando no se importó nada", async () => {
    importCatalogoProductosFromFile.mockResolvedValue({
      imported: 0,
      skipped: 0,
      errors: [],
    });
    const { result } = setup();

    await act(async () => {
      await result.current.handleFileSelected(new File(["x"], "p.xlsx"));
    });

    expect(result.current.importError).toBe("No se importó ningún producto.");
  });
});
