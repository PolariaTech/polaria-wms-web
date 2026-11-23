import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CustodioOrdenSalidaArmarPanel } from "./CustodioOrdenSalidaArmarPanel";

function buildProps(
  overrides: Partial<Parameters<typeof CustodioOrdenSalidaArmarPanel>[0]> = {},
) {
  return {
    isLoading: false,
    paqueteFieldLabel: "",
    detalleFieldLabel: "",
    ventasSeleccionadas: [],
    selectedCount: 0,
    mezclaCuentas: false,
    previsualizarButton: <button type="button">Previsualizar</button>,
    onOpenPicker: vi.fn(),
    onRemoveVenta: vi.fn(),
    onRefresh: vi.fn(),
    onArmarPaquete: vi.fn(),
    ...overrides,
  };
}

describe("CustodioOrdenSalidaArmarPanel", () => {
  it("sin ventas pide agregar al menos una", () => {
    render(<CustodioOrdenSalidaArmarPanel {...buildProps()} />);

    expect(
      screen.getByText(/agregá al menos una venta/i),
    ).toBeInTheDocument();
    expect(screen.queryByText("Armar paquete de despacho")).not.toBeInTheDocument();
  });

  it("con ventas permite quitar, actualizar y armar", async () => {
    const props = buildProps({
      selectedCount: 1,
      ventasSeleccionadas: [
        { idOrdenVenta: "ov-1", venta: "V-1", comprador: "C" } as never,
      ],
    });
    render(<CustodioOrdenSalidaArmarPanel {...props} />);

    await userEvent.click(screen.getByRole("button", { name: "Quitar V-1" }));
    expect(props.onRemoveVenta).toHaveBeenCalledWith("ov-1");

    await userEvent.click(screen.getByRole("button", { name: "Actualizar" }));
    expect(props.onRefresh).toHaveBeenCalled();

    await userEvent.click(
      screen.getByRole("button", { name: "Armar paquete de despacho" }),
    );
    expect(props.onArmarPaquete).toHaveBeenCalled();
  });

  it("avisa cuando se mezclan cuentas y deshabilita armar", () => {
    render(
      <CustodioOrdenSalidaArmarPanel
        {...buildProps({ selectedCount: 2, mezclaCuentas: true })}
      />,
    );

    expect(screen.getByText(/misma cuenta/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Armar paquete de despacho" }),
    ).toBeDisabled();
  });
});
