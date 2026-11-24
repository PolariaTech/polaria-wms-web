import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCustodioIngresoPage } from "./useCustodioIngresoPage";

const listOrdenesCompra = vi.fn();
const listOrdenesVentaOperador = vi.fn();
const listViajesEntrega = vi.fn();
const listUbicacionesEstadoBodega = vi.fn();

vi.mock("@/hooks/warehouse/useWarehouseStateRealtime", () => ({
  useWarehouseStateRealtime: () => ({
    rows: [],
    isConnected: true,
    isLoading: false,
    error: null,
    refetch: vi.fn(async () => undefined),
  }),
}));
vi.mock("@/providers/tenant/CompanyProvider", () => ({
  useCompany: () => ({ codigoCuenta: "C1", activeBodegaId: "B1" }),
}));
vi.mock("@/modules/purchases", () => ({
  listOrdenesCompra: (...args: unknown[]) => listOrdenesCompra(...args),
}));
vi.mock("@/modules/sales", () => ({
  listOrdenesVentaOperador: (...args: unknown[]) =>
    listOrdenesVentaOperador(...args),
}));
vi.mock("@/modules/transport", () => ({
  listViajesEntrega: (...args: unknown[]) => listViajesEntrega(...args),
}));
vi.mock("@/modules/warehouses", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/modules/warehouses")>();
  return {
    ...actual,
    listUbicacionesEstadoBodega: (...args: unknown[]) =>
      listUbicacionesEstadoBodega(...args),
  };
});

describe("useCustodioIngresoPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listOrdenesCompra.mockResolvedValue([
      { id_orden_compra: "a", estado: "emitida" },
      { id_orden_compra: "b", estado: "borrador" },
    ]);
    listOrdenesVentaOperador.mockResolvedValue([
      { idOrdenVenta: "ov-1" },
      { idOrdenVenta: "ov-2" },
    ]);
    listViajesEntrega.mockResolvedValue([{ idOrdenVenta: "ov-2" }]);
    listUbicacionesEstadoBodega.mockResolvedValue([]);
  });

  it("carga órdenes en transporte y ventas sin viaje", async () => {
    const { result } = renderHook(() => useCustodioIngresoPage());

    await waitFor(() => expect(result.current.ordenes).toHaveLength(1));
    await waitFor(() => expect(result.current.ventas).toHaveLength(1));

    expect(result.current.ordenes[0]?.id_orden_compra).toBe("a");
    expect(result.current.ventas[0]?.idOrdenVenta).toBe("ov-1");
    expect(result.current.activeBodegaId).toBe("B1");
    expect(result.current.isConnected).toBe(true);
    expect(result.current.zonaIngreso.id).toBe("entrada");
    expect(result.current.zonaSalida.id).toBe("salida");
    expect(result.current.cajasEnSalida).toBe(0);
  });

  it("handleSelectSlot ignora slots vacíos", async () => {
    const { result } = renderHook(() => useCustodioIngresoPage());
    await waitFor(() => expect(result.current.ordenes).toHaveLength(1));

    act(() =>
      result.current.handleSelectSlot({ visual: "vacia", detalle: null } as never),
    );
    expect(result.current.selectedSlot).toBeNull();

    const slot = { visual: "ocupada", detalle: { x: 1 }, slotNumber: 1 } as never;
    act(() => result.current.handleSelectSlot(slot));
    expect(result.current.selectedSlot).toBe(slot);
  });
});
