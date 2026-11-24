import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useFolioFacturaEdicion } from "./guardar-folio-factura-captura.client";

vi.mock("./list-orden-surtido-capturas.client", () => ({
  listOrdenSurtidoCapturasClient: vi.fn().mockResolvedValue([]),
}));

describe("useFolioFacturaEdicion", () => {
  it("arranca con valores vacíos", async () => {
    const { result } = renderHook(() =>
      useFolioFacturaEdicion({
        open: true,
        activo: true,
        codigoCuenta: "023WA",
        idOrdenVenta: "ov-1",
      }),
    );

    await waitFor(() => {
      expect(result.current.valores).toEqual({});
    });
  });
});
