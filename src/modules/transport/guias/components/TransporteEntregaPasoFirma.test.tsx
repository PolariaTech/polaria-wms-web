import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { TransporteEntregaPasoFirma } from "./TransporteEntregaPasoFirma";

describe("TransporteEntregaPasoFirma", () => {
  it("asigna el canvas ref y propaga eventos de puntero", async () => {
    const canvasRef = createRef<HTMLCanvasElement>();
    const onPointerDown = vi.fn();
    const onPointerMove = vi.fn();
    const onPointerUp = vi.fn();
    const onClear = vi.fn();

    const { container } = render(
      <TransporteEntregaPasoFirma
        canvasRef={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClear={onClear}
      />,
    );

    const canvas = container.querySelector("canvas")!;
    expect(canvasRef.current).toBe(canvas);

    fireEvent.pointerDown(canvas);
    fireEvent.pointerMove(canvas);
    fireEvent.pointerUp(canvas);
    expect(onPointerDown).toHaveBeenCalled();
    expect(onPointerMove).toHaveBeenCalled();
    expect(onPointerUp).toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Limpiar firma" }));
    expect(onClear).toHaveBeenCalled();
  });
});
