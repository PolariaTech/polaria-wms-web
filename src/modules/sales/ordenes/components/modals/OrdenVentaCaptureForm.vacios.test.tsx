import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FolioFacturaCampos } from "../../surtido/guardar-folio-factura-captura.client";
import { OrdenVentaCaptureFormEntrega } from "./OrdenVentaCaptureFormEntrega";
import { OrdenVentaCaptureFormPedido } from "./OrdenVentaCaptureFormPedido";
import { OrdenVentaCaptureFormProgramacion } from "./OrdenVentaCaptureFormProgramacion";

const AMBAR = "!border-polaria-warning-border";
const ROJO = "!border-polaria-danger-border";

const marks = {
  autoFields: new Set<string>(),
  warnFields: new Set<string>(),
  missingFields: new Set<string>(),
};

function entrega(parcial: Record<string, unknown> = {}) {
  return (
    <OrdenVentaCaptureFormEntrega
      direccion="Fairmont Mayakoba"
      onDireccion={vi.fn()}
      avisoVerificarDireccion={false}
      contacto=""
      onContacto={vi.fn()}
      telefono=""
      onTelefono={vi.fn()}
      correo="eliur@fairmont.com"
      onCorreo={vi.fn()}
      observaciones=""
      onObservaciones={vi.fn()}
      onClearField={vi.fn()}
      {...marks}
      {...parcial}
    />
  );
}

describe("campos vacíos resaltados en ámbar (REQ-428)", () => {
  it("Entrega: contacto y teléfono vacíos se resaltan; el correo y la dirección llenos, no", () => {
    render(entrega());

    expect(screen.getByLabelText("Contacto del cliente").className).toContain(AMBAR);
    expect(screen.getByLabelText("Teléfono del contacto").className).toContain(AMBAR);
    expect(screen.getByLabelText("Correo del contacto").className).not.toContain(AMBAR);
    expect(screen.getByLabelText(/Dirección de entrega/).className).not.toContain(AMBAR);
  });

  it("Entrega: al llenar el campo deja de resaltarse", () => {
    const { rerender } = render(entrega());
    expect(screen.getByLabelText("Contacto del cliente").className).toContain(AMBAR);

    rerender(entrega({ contacto: "Eliur Cabrera" }));

    expect(screen.getByLabelText("Contacto del cliente").className).not.toContain(AMBAR);
  });

  it("Entrega: un campo marcado como faltante sigue en rojo, no pasa a ámbar", () => {
    render(entrega({ missingFields: new Set(["contacto"]) }));

    const contacto = screen.getByLabelText("Contacto del cliente");
    expect(contacto.className).toContain(ROJO);
    expect(contacto.className).not.toContain(AMBAR);
  });

  it("Programación: «Hora desde» y «Hora hasta» vacías se resaltan; con hora, no", () => {
    const props = {
      fechaEntrega: "2099-01-15",
      onFechaEntrega: vi.fn(),
      onClearFechaError: vi.fn(),
      esPorConfirmar: false,
      onVentanaDesde: vi.fn(),
      onVentanaHasta: vi.fn(),
      onClearField: vi.fn(),
      marks,
    };
    const { rerender } = render(<OrdenVentaCaptureFormProgramacion {...props} ventanaDesde="" ventanaHasta="" />);
    expect(screen.getByLabelText("Hora desde").className).toContain(AMBAR);
    expect(screen.getByLabelText("Hora hasta").className).toContain(AMBAR);

    rerender(<OrdenVentaCaptureFormProgramacion {...props} ventanaDesde="06:00" ventanaHasta="" />);

    expect(screen.getByLabelText("Hora desde").className).not.toContain(AMBAR);
    expect(screen.getByLabelText("Hora hasta").className).toContain(AMBAR);
  });

  it("Datos del pedido: orden de compra y centro de consumo vacíos se resaltan", () => {
    const props = {
      onOrdenCompraHotel: vi.fn(),
      exigeOc: false,
      onCentroConsumo: vi.fn(),
      moneda: "MXN",
      onBuscarMoneda: vi.fn(),
      onClearField: vi.fn(),
      marks,
    };
    const { rerender } = render(<OrdenVentaCaptureFormPedido {...props} ordenCompraHotel="" centroConsumo="" />);
    expect(screen.getByLabelText("Orden de compra del cliente").className).toContain(AMBAR);
    expect(screen.getByLabelText("Centro de consumo").className).toContain(AMBAR);

    rerender(<OrdenVentaCaptureFormPedido {...props} ordenCompraHotel="MYK-0306504" centroConsumo="02-In Room Dining" />);

    expect(screen.getByLabelText("Orden de compra del cliente").className).not.toContain(AMBAR);
    expect(screen.getByLabelText("Centro de consumo").className).not.toContain(AMBAR);
  });

  it("Datos del pedido: si el cliente exige OC y falta, sigue en rojo", () => {
    render(
      <OrdenVentaCaptureFormPedido
        ordenCompraHotel=""
        onOrdenCompraHotel={vi.fn()}
        exigeOc
        centroConsumo="x"
        onCentroConsumo={vi.fn()}
        moneda="MXN"
        onBuscarMoneda={vi.fn()}
        onClearField={vi.fn()}
        marks={marks}
      />,
    );

    expect(screen.getByLabelText(/Orden de compra del cliente/).className).toContain(ROJO);
  });

  it("Folio de factura: vacío se resalta y con folio no", () => {
    const ots = [{ id: "ot-1", label: "OT 1" }];
    const { rerender } = render(
      <FolioFacturaCampos ots={ots} paginar={false} activa={null} valores={{}} onChange={vi.fn()} />,
    );
    expect(screen.getByLabelText("Folio de factura").className).toContain(AMBAR);

    rerender(<FolioFacturaCampos ots={ots} paginar={false} activa={null} valores={{ "ot-1": "F-100" }} onChange={vi.fn()} />);

    expect(screen.getByLabelText("Folio de factura").className).not.toContain(AMBAR);
  });
});
