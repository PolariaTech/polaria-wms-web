import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCypherDrawerLog } from "./cypher-drawer-log";

const fetchOrdenVentaLog = vi.fn();

vi.mock("../../services/orden-venta-log.client", () => ({
  fetchOrdenVentaLog: (...args: unknown[]) => fetchOrdenVentaLog(...args),
}));

describe("useCypherDrawerLog en vivo", () => {
  beforeEach(() => {
    fetchOrdenVentaLog.mockReset();
  });

  it("al volver a la ventana muestra el evento nuevo de la bitácora", async () => {
    fetchOrdenVentaLog
      .mockResolvedValueOnce([{ id: "antes", mensaje: "Orden abierta", createdAt: "2026-01-01" }])
      .mockResolvedValue([
        { id: "nueva", mensaje: "Prefactura aprobada en la recepción.", createdAt: "2026-01-02" },
        { id: "antes", mensaje: "Orden abierta", createdAt: "2026-01-01" },
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

    await waitFor(() => expect(result.current.logEntries.map((entrada) => entrada.id)).toEqual(["antes"]));

    act(() => {
      window.dispatchEvent(new Event("focus"));
    });

    await waitFor(() =>
      expect(result.current.logEntries.map((entrada) => entrada.id)).toEqual(["nueva", "antes"]),
    );
  });
});
