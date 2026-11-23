import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CustodioOrdenSalidaPaqueteListoPanel } from "./CustodioOrdenSalidaPaqueteListoPanel";

function buildProps(
  overrides: Partial<
    Parameters<typeof CustodioOrdenSalidaPaqueteListoPanel>[0]
  > = {},
) {
  return {
    ventasPaquete: [
      { idOrdenVenta: "ov-1", venta: "V-1", comprador: "Comp" } as never,
    ],
    cajasEnSalida: 3,
    camionFieldLabel: "",
    camionPickerPlaceholder: "Buscar camión disponible",
    camionPickerEnabled: true,
    enviando: false,
    puedeEnviar: true,
    previsualizarButton: <button type="button">Previsualizar</button>,
    onOpenCamionPicker: vi.fn(),
    onEnviar: vi.fn(),
    onCancelar: vi.fn(),
    ...overrides,
  };
}

describe("CustodioOrdenSalidaPaqueteListoPanel", () => {
  it("lista ventas y permite enviar o cancelar", async () => {
    const props = buildProps();
    render(<CustodioOrdenSalidaPaqueteListoPanel {...props} />);

    expect(screen.getByText("V-1")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Enviar paquete al transporte" }),
    );
    expect(props.onEnviar).toHaveBeenCalled();

    await userEvent.click(
      screen.getByRole("button", { name: "Cancelar paquete" }),
    );
    expect(props.onCancelar).toHaveBeenCalled();
  });

  it("sin cajas muestra advertencia y deshabilita enviar", () => {
    render(
      <CustodioOrdenSalidaPaqueteListoPanel
        {...buildProps({ cajasEnSalida: 0, puedeEnviar: false })}
      />,
    );

    expect(screen.getByText(/No hay cajas en zona de salida/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Enviar paquete al transporte" }),
    ).toBeDisabled();
  });

  it("muestra 'Enviando…' mientras envía", () => {
    render(
      <CustodioOrdenSalidaPaqueteListoPanel
        {...buildProps({ enviando: true, puedeEnviar: false })}
      />,
    );
    expect(screen.getByRole("button", { name: "Enviando…" })).toBeDisabled();
  });
});
