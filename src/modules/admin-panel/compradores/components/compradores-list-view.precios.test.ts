import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { useCompradoresListPreciosHandlers } from "./compradores-list-view.precios";

const mockListTemplate = vi.fn();
const mockImportPrecios = vi.fn();
const mockDownloadExcel = vi.fn();

vi.mock("../services/comprador-producto-alias.service", () => ({
  listCompradorPreciosTemplateAdmin: (...args: unknown[]) =>
    mockListTemplate(...args),
  importCompradorPreciosFromFile: (...args: unknown[]) =>
    mockImportPrecios(...args),
}));

vi.mock("../utils/comprador-precios-excel", () => ({
  downloadCompradorPreciosExcelTemplate: (...args: unknown[]) =>
    mockDownloadExcel(...args),
}));

function crearParams(overrides: Partial<Parameters<typeof useCompradoresListPreciosHandlers>[0]> = {}) {
  return {
    codigoCuenta: "CTA-1",
    runScoped: <T,>(fn: () => Promise<T>) => fn(),
    reload: vi.fn().mockResolvedValue(undefined),
    rows: [
      {
        codigo: "C1",
        comprador: "Hotel Sol",
        grupo: "Hoteles",
      } as never,
    ],
    productos: [{ idProducto: "p1", codigo: "TOM", nombre: "Tomate" }],
    isExportingPrecios: false,
    setIsExportingPrecios: vi.fn(),
    isImportingPrecios: false,
    setIsImportingPrecios: vi.fn(),
    isPrintingPrecios: false,
    setIsPrintingPrecios: vi.fn(),
    setPreciosError: vi.fn(),
    setPreciosStatus: vi.fn(),
    setIsPreciosModalOpen: vi.fn(),
    ...overrides,
  };
}

describe("useCompradoresListPreciosHandlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListTemplate.mockResolvedValue([{ codigo: "C1" }]);
    mockDownloadExcel.mockResolvedValue(undefined);
    mockImportPrecios.mockResolvedValue({ imported: 3, errors: [] });
  });

  it("proyecta opciones de impresión y productos desde rows y productos", () => {
    const params = crearParams();
    const { result } = renderHook(() =>
      useCompradoresListPreciosHandlers(params),
    );

    expect(result.current.preciosPrintOptions).toEqual([
      { codigo: "C1", nombre: "Hotel Sol", grupo: "Hoteles" },
    ]);
    expect(result.current.preciosProductoOptions).toEqual([
      { idProducto: "p1", codigo: "TOM", nombre: "Tomate" },
    ]);
  });

  it("exporta plantilla de precios, cierra modal y maneja errores de dominio o genéricos", async () => {
    const params = crearParams();
    const { result } = renderHook(() =>
      useCompradoresListPreciosHandlers(params),
    );

    await act(async () => {
      await result.current.handleExportPrecios({
        fechaInicio: "2026-11-01",
        fechaFin: "2026-11-30",
      });
    });

    expect(mockListTemplate).toHaveBeenCalledWith({
      codigoCuenta: "CTA-1",
      filters: { fechaInicio: "2026-11-01", fechaFin: "2026-11-30" },
    });
    expect(mockDownloadExcel).toHaveBeenCalledWith([{ codigo: "C1" }], {
      fechaInicio: "2026-11-01",
      fechaFin: "2026-11-30",
    });
    expect(params.setIsPreciosModalOpen).toHaveBeenCalledWith(false);
    expect(params.setIsExportingPrecios).toHaveBeenLastCalledWith(false);

    mockListTemplate.mockRejectedValueOnce(
      new DomainServiceError("Sin permiso de precios"),
    );
    await act(async () => {
      await result.current.handleExportPrecios({});
    });
    expect(params.setPreciosError).toHaveBeenLastCalledWith(
      "Sin permiso de precios",
    );

    mockListTemplate.mockRejectedValueOnce(new Error("fallo inesperado"));
    await act(async () => {
      await result.current.handleExportPrecios({});
    });
    expect(params.setPreciosError).toHaveBeenLastCalledWith(
      "No se pudo exportar la plantilla de precios.",
    );
  });

  it("importa precios, recarga cuando hay filas válidas y reporta cuando no hay cambios", async () => {
    const params = crearParams();
    const file = new File(["x"], "precios.xlsx");
    const { result } = renderHook(() =>
      useCompradoresListPreciosHandlers(params),
    );

    await act(async () => {
      await result.current.handleImportPrecios(file);
    });

    expect(params.setPreciosStatus).toHaveBeenCalledWith(
      "Se importaron 3 fila(s).",
    );
    expect(params.reload).toHaveBeenCalledTimes(1);

    mockImportPrecios.mockResolvedValueOnce({ imported: 0, errors: [] });
    await act(async () => {
      await result.current.handleImportPrecios(file);
    });
    expect(params.setPreciosError).toHaveBeenLastCalledWith(
      "No hay cambios para importar.",
    );
    expect(params.reload).toHaveBeenCalledTimes(1);
  });

  it("imprime lista de precios y no ejecuta acciones si falta codigoCuenta", async () => {
    const params = crearParams();
    const { result } = renderHook(() =>
      useCompradoresListPreciosHandlers(params),
    );

    await act(async () => {
      await result.current.handlePrintPrecios({
        grupos: ["Hoteles"],
        codigosComprador: ["C1"],
      });
    });

    expect(mockDownloadExcel).toHaveBeenCalledWith([{ codigo: "C1" }], {
      variant: "print",
    });
    expect(params.setPreciosStatus).toHaveBeenCalledWith(
      "Excel de lista de precios generado.",
    );
    expect(params.setIsPreciosModalOpen).toHaveBeenCalledWith(false);

    const sinCuenta = crearParams({ codigoCuenta: null });
    const { result: sinCuentaHook } = renderHook(() =>
      useCompradoresListPreciosHandlers(sinCuenta),
    );
    await act(async () => {
      await sinCuentaHook.current.handlePrintPrecios({});
    });
    expect(sinCuenta.setIsPrintingPrecios).not.toHaveBeenCalled();
  });
});
