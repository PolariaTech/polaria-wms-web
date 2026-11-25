import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useOrdenVentaFotosViewer } from "./use-orden-venta-fotos-viewer";

describe("useOrdenVentaFotosViewer", () => {
  it("reinicia índice y zoom al abrir fotos", () => {
    const { result, rerender } = renderHook(
      ({ open, showing }) =>
        useOrdenVentaFotosViewer(open, showing, "ot-1", 3),
      { initialProps: { open: false, showing: false } },
    );

    rerender({ open: true, showing: true });
    expect(result.current.index).toBe(0);
    expect(result.current.zoom).toBe(1);

    act(() => {
      result.current.setZoomClamped(2);
    });
    expect(result.current.zoom).toBe(2);

    act(() => {
      result.current.resetView();
    });
    expect(result.current.zoom).toBe(1);
  });
});