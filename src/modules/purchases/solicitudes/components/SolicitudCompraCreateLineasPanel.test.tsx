import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SolicitudCompraCreateLineasPanel } from "./SolicitudCompraCreateLineasPanel";

function buildProps(
  overrides: Partial<Parameters<typeof SolicitudCompraCreateLineasPanel>[0]> = {},
) {
  return {
    lines: [],
    productos: [{ idProducto: "p-1" } as never],
    selectedProductoLabel: "",
    pickPesoKg: "",
    disabled: false,
    isLoadingOptions: false,
    onOpenProductoPicker: vi.fn(),
    onChangePeso: vi.fn(),
    onAddLine: vi.fn(),
    onRemoveLine: vi.fn(),
    ...overrides,
  };
}

describe("SolicitudCompraCreateLineasPanel", () => {
  it("muestra 'Sin líneas.' y dispara agregar", async () => {
    const props = buildProps();
    render(<SolicitudCompraCreateLineasPanel {...props} />);

    expect(screen.getByText("Sin líneas.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Agregar/ }));
    expect(props.onAddLine).toHaveBeenCalled();
  });

  it("lista líneas y permite quitarlas", async () => {
    const props = buildProps({
      lines: [
        { idProducto: "p-1", pesoKg: 3, titleSnapshot: "Pollo", skuSnapshot: "P1" },
      ],
    });
    render(<SolicitudCompraCreateLineasPanel {...props} />);

    expect(screen.getByText("Pollo")).toBeInTheDocument();
    expect(screen.getByText(/SKU P1/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Quitar línea" }));
    expect(props.onRemoveLine).toHaveBeenCalledWith(0);
  });

  it("propaga cambios de peso", async () => {
    const props = buildProps();
    render(<SolicitudCompraCreateLineasPanel {...props} />);

    await userEvent.type(screen.getByLabelText("Peso (kg)"), "1");
    expect(props.onChangePeso).toHaveBeenCalledWith("1");
  });
});
