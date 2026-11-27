import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getOrdenVentaDetalle } from "../../../shared/services/sales.service";
import type { OrdenVentaDetalleRow } from "../../../shared/types/sales.types";
import { useCypherDrawerOrdenLoad } from "./cypher-drawer-orden-load";

vi.mock("../../../shared/services/sales.service", () => ({
  getOrdenVentaDetalle: vi.fn(),
}));

vi.mock("@/lib/supabase/cuenta-schema", () => ({
  withCuentaSchema: (_cuenta: string, run: () => Promise<unknown>) => run(),
}));

const getDetalle = vi.mocked(getOrdenVentaDetalle);

describe("useCypherDrawerOrdenLoad (REQ-400)", () => {
  beforeEach(() => {
    getDetalle.mockReset();
    getDetalle.mockResolvedValue({ idOrdenVenta: "ov-1" } as OrdenVentaDetalleRow);
  });

  it("abre solo la sección 00 al consultar y al editar", async () => {
    const onResetUi = vi.fn();
    const { result, rerender } = renderHook(
      ({ inspect }: { inspect: boolean }) =>
        useCypherDrawerOrdenLoad({
          idOrdenVenta: "ov-1",
          codigoCuenta: "CTA",
          inspect,
          onResetUi,
        }),
      { initialProps: { inspect: false } },
    );

    expect(result.current.activeStage).toBe("correo");
    expect([...result.current.openStages]).toEqual(["correo"]);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect([...result.current.openStages]).toEqual(["correo"]);

    rerender({ inspect: true });

    await waitFor(() => {
      expect(getDetalle.mock.calls.length).toBeGreaterThan(1);
    });
    expect(result.current.activeStage).toBe("correo");
    expect([...result.current.openStages]).toEqual(["correo"]);
  });
});
