import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCypherDrawerLog } from "./cypher-drawer-log";

const fetchOrdenVentaLog = vi.fn();

vi.mock("../../services/orden-venta-log.client", () => ({
  fetchOrdenVentaLog: (...args: unknown[]) => fetchOrdenVentaLog(...args),
}));

describe("useCypherDrawerLog", () => {
  beforeEach(() => {
    fetchOrdenVentaLog.mockReset();
    fetchOrdenVentaLog.mockResolvedValue([]);
  });

  it("sin id no consulta la bitácora", () => {
    const { result } = renderHook(() =>
      useCypherDrawerLog({
        idOrdenVenta: null,
        codigoCuenta: "c",
        idOrdenTrabajoBitacora: null,
        orden: null,
        row: null,
        logNonce: 0,
      }),
    );
    expect(result.current.logEntries).toEqual([]);
    expect(fetchOrdenVentaLog).not.toHaveBeenCalled();
  });

  it("con id pide el log y deja de cargar", async () => {
    fetchOrdenVentaLog.mockResolvedValue([
      { id: "1", mensaje: "ok", created_at: "2026-01-01" },
    ]);
    const { result } = renderHook(() =>
      useCypherDrawerLog({
        idOrdenVenta: "ov-1",
        codigoCuenta: "c",
        idOrdenTrabajoBitacora: null,
        orden: null,
        row: null,
        logNonce: 1,
      }),
    );
    await waitFor(() => expect(result.current.logLoading).toBe(false));
    expect(fetchOrdenVentaLog).toHaveBeenCalled();
  });
});
