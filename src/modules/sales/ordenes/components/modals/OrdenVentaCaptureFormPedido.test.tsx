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

describe("OrdenVentaCaptureFormPedido (REQ-278)", () => {
  it("lleva OC, centro y moneda", () => {
    render(<OrdenVentaCaptureFormPedido {...propsBase()} />);

    expect(screen.getByLabelText(/Orden de compra del cliente/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Centro de consumo/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Moneda$/)).toBeInTheDocument();
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
    expect(props.onClearField).toHaveBeenCalledWith("ordenCompraHotel");
  });

  it("un cliente que exige OC la pide y lo explica", () => {
    render(<OrdenVentaCaptureFormPedido {...propsBase({ exigeOc: true })} />);

    expect(screen.getByText("Este cliente exige OC para facturar.")).toBeInTheDocument();
    expect(screen.getByLabelText(/Orden de compra del cliente/)).toBeRequired();
  });

  it("escribir el centro de consumo lo guarda y quita su marca", async () => {
    const user = userEvent.setup();
    const props = propsBase();
    render(<OrdenVentaCaptureFormPedido {...props} />);

    await user.type(screen.getByLabelText(/Centro de consumo/), "C");

    expect(props.onCentroConsumo).toHaveBeenCalledWith("C");
    expect(props.onClearField).toHaveBeenCalledWith("centroConsumo");
  });

  it("avisa cuando el centro de la ficha es distinto al del pedido", () => {
    const props = propsBase({
      marks: { ...marks, warnFields: new Set(["centroConsumo"]) },
    });
    render(<OrdenVentaCaptureFormPedido {...props} />);

    expect(screen.getByText("Registrado en ficha distinto al del pedido")).toBeInTheDocument();
  });

  it("buscar moneda abre el selector", async () => {
    const user = userEvent.setup();
    const props = propsBase();
    render(<OrdenVentaCaptureFormPedido {...props} />);

    await user.click(screen.getByRole("button", { name: /Moneda|Buscar/i }));

    expect(props.onBuscarMoneda).toHaveBeenCalledOnce();
  });
});
