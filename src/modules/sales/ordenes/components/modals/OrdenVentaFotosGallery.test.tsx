import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OrdenVentaFotosGallery } from "./OrdenVentaFotosGallery";

describe("OrdenVentaFotosGallery", () => {
  it("muestra mensaje vacío cuando no hay fotos", () => {
    const viewer = {
      index: 0,
      zoom: 1,
      pan: { x: 0, y: 0 },
      isPanning: false,
      resetView: vi.fn(),
      goPrev: vi.fn(),
      goNext: vi.fn(),
      setZoomClamped: vi.fn(),
      onPanPointerDown: vi.fn(),
      onPanPointerMove: vi.fn(),
      onPanPointerUp: vi.fn(),
      selectIndex: vi.fn(),
      onGalleryWheel: vi.fn(),
    };

    render(
      <OrdenVentaFotosGallery
        fotos={[]}
        isLoadingFotos={false}
        allowBackToOts={false}
        onBackToOts={vi.fn()}
        viewer={viewer}
      />,
    );
    expect(
      screen.getByText(/no tiene fotos en el historial/i),
    ).toBeInTheDocument();
  });
});