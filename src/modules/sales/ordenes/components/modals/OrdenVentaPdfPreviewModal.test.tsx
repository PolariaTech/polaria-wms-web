import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { OrdenVentaPdfPreviewModal } from "./OrdenVentaPdfPreviewModal";

describe("OrdenVentaPdfPreviewModal (REQ-311)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("muestra Generando PDF… mientras carga", () => {
    render(
      <OrdenVentaPdfPreviewModal
        open
        title="Preview"
        blob={null}
        isLoading
        onClose={() => {}}
      />,
    );
    expect(screen.getByText("Generando PDF…")).toBeTruthy();
  });

  it("tras timeout muestra error en lugar de Loading eterno", async () => {
    render(
      <OrdenVentaPdfPreviewModal
        open
        title="Preview"
        blob={null}
        isLoading
        onClose={() => {}}
      />,
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(45_000);
    });
    expect(
      screen.getByText(/tardando demasiado/i),
    ).toBeTruthy();
  });
});
