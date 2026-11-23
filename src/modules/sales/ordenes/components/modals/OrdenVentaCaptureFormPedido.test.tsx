import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { OrdenVentaCaptureFormPedido } from "./OrdenVentaCaptureFormPedido";

const marks = {
  autoFields: new Set<string>(),
  warnFields: new Set<string>(),
  missingFields: new Set<string>(),
};

function propsBase(parcial: Record<string, unknown> = {}) {
  return {
    ordenCompraHotel: "",
    onOrdenCompraHotel: vi.fn(),
    exigeOc: false,
    centroConsumo: "",
    onCentroConsumo: vi.fn(),
    moneda: "MXN",
    onBuscarMoneda: vi.fn(),
    onClearField: vi.fn(),
    marks,
    ...parcial,
  };
}

describe("OrdenVentaCaptureFormPedido (REQ-278/328)", () => {
  it("lleva OC, centro y moneda; no muestra referencia de pedido", () => {
    render(<OrdenVentaCaptureFormPedido {...propsBase()} />);

    expect(screen.getByLabelText(/Orden de compra del cliente/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Centro de consumo/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Moneda$/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Referencia de pedido/)).not.toBeInTheDocument();
    for (const etiqueta of [/Notas generales/, /Prioridad/, /Fecha de entrega/, /Hora desde/]) {
      expect(screen.queryByLabelText(etiqueta)).not.toBeInTheDocument();
    }
  });

  it("escribir la orden de compra la guarda y quita su marca de revisión", async () => {
    const user = userEvent.setup();
    const props = propsBase();
    render(<OrdenVentaCaptureFormPedido {...props} />);

    await user.type(screen.getByLabelText(/Orden de compra del cliente/), "7");

    expect(props.onOrdenCompraHotel).toHaveBeenCalledWith("7");
    expect(props.onClearField).toHaveBeenCalledWith("ordenCompraHotel", "7");
  });

  it("abre el picker de moneda", async () => {
    const user = userEvent.setup();
    const props = propsBase();
    render(<OrdenVentaCaptureFormPedido {...props} />);

    await user.click(screen.getByRole("button", { name: /Moneda|Buscar/i }));

    expect(props.onBuscarMoneda).toHaveBeenCalledOnce();
  });

  it("REQ-349: con varias OT aclara alcance en OC (no en centro)", () => {
    render(<OrdenVentaCaptureFormPedido {...propsBase({ multiOt: true })} />);

    expect(screen.getByText(/Aplica a todas las OT/)).toBeInTheDocument();
    expect(screen.queryByText("Solo esta OT.")).not.toBeInTheDocument();
  });

  it("REQ-349: exigeOc + multiOt combina ambos hints en OC", () => {
    render(
      <OrdenVentaCaptureFormPedido
        {...propsBase({ multiOt: true, exigeOc: true })}
      />,
    );
    expect(
      screen.getByText("Este cliente exige OC para facturar. Aplica a todas las OT."),
    ).toBeInTheDocument();
  });

  it("REQ-349: warn de centro no usa «Solo esta OT.»", () => {
    render(
      <OrdenVentaCaptureFormPedido
        {...propsBase({
          multiOt: true,
          marks: { ...marks, warnFields: new Set(["centroConsumo"]) },
        })}
      />,
    );
    expect(
      screen.getByText("Registrado en ficha distinto al del pedido"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Solo esta OT.")).not.toBeInTheDocument();
  });
});
