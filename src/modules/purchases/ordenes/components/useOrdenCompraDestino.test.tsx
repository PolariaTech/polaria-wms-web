import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrdenCompraRow } from "../../shared/types/purchases.types";
import { useOrdenCompraDestino } from "./useOrdenCompraDestino";

const listBodegasDestinoCompraApi = vi.fn();

vi.mock("../../shared/services/purchases-api.service", () => ({
  listBodegasDestinoCompraApi: (...args: unknown[]) =>
    listBodegasDestinoCompraApi(...args),
}));

const ORDEN = {
  id_orden_compra: "oc-1",
  estado: "borrador",
  destino_tipo: "interna",
  id_bodega: "b-1",
  fecha_entrega_estimada: null,
} as OrdenCompraRow;

describe("useOrdenCompraDestino", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listBodegasDestinoCompraApi.mockResolvedValue([
      { idBodega: "b-1", codigo: "B1", nombre: "Uno", slotsLibres: 3 },
      { idBodega: "b-2", codigo: "B2", nombre: "Dos", slotsLibres: 1 },
    ]);
  });

  it("carga bodegas y expone opciones", async () => {
    const { result } = renderHook(() =>
      useOrdenCompraDestino({
        orden: ORDEN,
        codigoCuenta: "C",
        onDestinoChange: vi.fn(),
        isSavingDestino: false,
      }),
    );

    await waitFor(() => expect(result.current.bodegaOptions).toHaveLength(2));
    expect(listBodegasDestinoCompraApi).toHaveBeenCalledWith({
      codigoCuenta: "C",
      tipo: "interna",
    });
    expect(result.current.canEditDestino).toBe(true);
    expect(result.current.bodegaSeleccionada?.idBodega).toBe("b-1");
  });

  it("emite patches al cambiar tipo, bodega y fecha", async () => {
    const onDestinoChange = vi.fn();
    const { result } = renderHook(() =>
      useOrdenCompraDestino({
        orden: ORDEN,
        codigoCuenta: "C",
        onDestinoChange,
        isSavingDestino: false,
      }),
    );
    await waitFor(() => expect(result.current.bodegaOptions).toHaveLength(2));

    act(() => result.current.handleBodegaChange("b-2"));
    expect(onDestinoChange).toHaveBeenLastCalledWith({ idBodega: "b-2" });

    act(() => result.current.handleFechaEntregaChange("2026-01-02"));
    expect(onDestinoChange).toHaveBeenLastCalledWith({
      fechaEntregaEstimada: "2026-01-02",
    });

    act(() => result.current.handleDestinoTipoChange("externa"));
    expect(onDestinoChange).toHaveBeenLastCalledWith({
      destinoTipo: "externa",
      idBodega: "",
    });
  });

  it("no edita si la orden no es borrador o está guardando", async () => {
    const onDestinoChange = vi.fn();
    const { result } = renderHook(() =>
      useOrdenCompraDestino({
        orden: { ...ORDEN, estado: "emitida" },
        codigoCuenta: "C",
        onDestinoChange,
        isSavingDestino: false,
      }),
    );
    await waitFor(() => expect(result.current.isLoadingBodegas).toBe(false));

    act(() => result.current.handleBodegaChange("b-2"));
    expect(onDestinoChange).not.toHaveBeenCalled();
  });

  it("expone el error al fallar la carga de bodegas", async () => {
    listBodegasDestinoCompraApi.mockRejectedValue(new Error("sin red"));
    const { result } = renderHook(() =>
      useOrdenCompraDestino({
        orden: ORDEN,
        codigoCuenta: "C",
        onDestinoChange: vi.fn(),
        isSavingDestino: false,
      }),
    );

    await waitFor(() => expect(result.current.bodegasError).toBe("sin red"));
  });
});
