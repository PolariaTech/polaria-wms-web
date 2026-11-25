import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useCompradorPreciosGestionState } from "./use-comprador-precios-gestion-state";

function buildProps(
  overrides: Partial<Parameters<typeof useCompradorPreciosGestionState>[0]> = {},
) {
  return {
    open: true,
    onClose: vi.fn(),
    onExport: vi.fn(),
    onImport: vi.fn(),
    onPrint: vi.fn(),
    gruposDisponibles: ["Grupo A", "Grupo B"],
    compradores: [{ codigo: "WAL01", nombre: "Walmart", grupo: "Grupo A" }],
    productos: [{ idProducto: "p-1", codigo: "DICOK", nombre: "Pollo" }],
    ...overrides,
  };
}

describe("useCompradorPreciosGestionState", () => {
  it("inicia en acciones con todos los productos seleccionados", () => {
    const { result } = renderHook(() =>
      useCompradorPreciosGestionState(buildProps()),
    );

    expect(result.current.step).toBe("acciones");
    expect(result.current.selectedProductos).toEqual(["p-1"]);
    expect(result.current.catalogoGrupos).toEqual(["Grupo A", "Grupo B"]);
  });

  it("no exporta sin grupos seleccionados y sí con selección válida", () => {
    const props = buildProps();
    const { result } = renderHook(() => useCompradorPreciosGestionState(props));

    act(() => result.current.handleConfirmExport());
    expect(props.onExport).not.toHaveBeenCalled();

    act(() => result.current.setSelectedGrupos(["Grupo A"]));
    act(() => result.current.handleConfirmExport());
    expect(props.onExport).toHaveBeenCalledWith(
      expect.objectContaining({
        grupos: ["Grupo A"],
        idProductos: ["p-1"],
      }),
    );
  });

  it("imprime solo con grupos o compradores y resume la selección", () => {
    const props = buildProps();
    const { result } = renderHook(() => useCompradorPreciosGestionState(props));

    act(() => result.current.handleConfirmPrint());
    expect(props.onPrint).not.toHaveBeenCalled();

    act(() => result.current.setPrintCodigosComprador(["WAL01"]));
    expect(result.current.printCompradorFieldValue).toBe("WAL01 — Walmart");
    act(() => result.current.handleConfirmPrint());
    expect(props.onPrint).toHaveBeenCalledWith({
      grupos: [],
      codigosComprador: ["WAL01"],
    });
  });

  it("handleClose delega en onClose cuando no está ocupado", () => {
    const props = buildProps();
    const { result } = renderHook(() => useCompradorPreciosGestionState(props));

    act(() => result.current.handleClose());
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});
