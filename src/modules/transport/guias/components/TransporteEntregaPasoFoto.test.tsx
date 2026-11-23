import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TransporteEntregaPasoFoto } from "./TransporteEntregaPasoFoto";

describe("TransporteEntregaPasoFoto", () => {
  it("cambia la etiqueta según haya foto y muestra preview", () => {
    const { rerender } = render(
      <TransporteEntregaPasoFoto
        hasFoto={false}
        fotoPreview={null}
        onFotoChange={() => undefined}
      />,
    );
    expect(screen.getByText("Elegir archivo")).toBeInTheDocument();
    expect(screen.queryByAltText("Vista previa de evidencia")).toBeNull();

    rerender(
      <TransporteEntregaPasoFoto
        hasFoto
        fotoPreview="blob:abc"
        onFotoChange={() => undefined}
      />,
    );
    expect(screen.getByText("Cambiar foto")).toBeInTheDocument();
    expect(screen.getByAltText("Vista previa de evidencia")).toHaveAttribute(
      "src",
      "blob:abc",
    );
  });

  it("invoca onFotoChange al elegir archivo", async () => {
    const onFotoChange = vi.fn();
    render(
      <TransporteEntregaPasoFoto
        hasFoto={false}
        fotoPreview={null}
        onFotoChange={onFotoChange}
      />,
    );

    const file = new File(["x"], "a.png", { type: "image/png" });
    await userEvent.upload(screen.getByLabelText("Elegir foto de evidencia"), file);

    expect(onFotoChange).toHaveBeenCalled();
  });
});
