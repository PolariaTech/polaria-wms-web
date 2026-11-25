import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TransporteEntregaPasoConformidad } from "./TransporteEntregaPasoConformidad";

function renderPaso(
  conforme: boolean | null,
  overrides: Partial<Parameters<typeof TransporteEntregaPasoConformidad>[0]> = {},
) {
  const props = {
    conforme,
    descripcion: "",
    onConforme: vi.fn(),
    onNoConforme: vi.fn(),
    onChangeDescripcion: vi.fn(),
    ...overrides,
  };
  render(<TransporteEntregaPasoConformidad {...props} />);
  return props;
}

describe("TransporteEntregaPasoConformidad", () => {
  it("dispara conforme / no conforme", async () => {
    const props = renderPaso(null);

    await userEvent.click(screen.getByRole("button", { name: "Sí, conforme" }));
    await userEvent.click(screen.getByRole("button", { name: "No conforme" }));

    expect(props.onConforme).toHaveBeenCalled();
    expect(props.onNoConforme).toHaveBeenCalled();
    expect(screen.queryByPlaceholderText("Describí la incidencia")).toBeNull();
  });

  it("pide descripción si no es conforme", async () => {
    const props = renderPaso(false);

    await userEvent.type(
      screen.getByPlaceholderText("Describí la incidencia"),
      "x",
    );
    expect(props.onChangeDescripcion).toHaveBeenCalledWith("x");
  });
});
