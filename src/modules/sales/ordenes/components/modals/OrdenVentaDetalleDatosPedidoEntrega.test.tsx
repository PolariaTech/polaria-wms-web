import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { OrdenVentaDetalleRow } from "../../../shared/types/sales.types";
import {
  LABELS_DATOS_PEDIDO_DETALLE,
  ORDEN_BLOQUE_ENTREGA_DETALLE,
  partirVentanaEntrega,
} from "./orden-campos-datos-pedido";
import { OrdenVentaDetalleDatosPedidoEntrega } from "./OrdenVentaDetalleDatosPedidoEntrega";

const ordenStub = {
  id: "ov-1",
  codigo: "OV-1",
  estado: "borrador",
  created_at: "2026-11-10T12:00:00Z",
  fecha_pedido: "2026-11-10",
  comprador_codigo: "C-1",
  comprador_rfc: "XAXX010101000",
  comprador_apodo: "Hotel Demo",
} as OrdenVentaDetalleRow;

describe("partirVentanaEntrega (REQ-305)", () => {
  it("separa desde y hasta con guión tipográfico", () => {
    expect(partirVentanaEntrega("06:00 – 09:00")).toEqual({
      desde: "06:00",
      hasta: "09:00",
    });
  });

  it("separa con guión simple", () => {
    expect(partirVentanaEntrega("08:00-12:30")).toEqual({
      desde: "08:00",
      hasta: "12:30",
    });
  });
});

describe("OrdenVentaDetalleDatosPedidoEntrega (REQ-305)", () => {
  it("pone moneda en Datos del pedido y no muestra Prioridad", () => {
    expect(LABELS_DATOS_PEDIDO_DETALLE).toContain("Moneda");
    expect(LABELS_DATOS_PEDIDO_DETALLE).not.toContain("Prioridad");
    expect(ORDEN_BLOQUE_ENTREGA_DETALLE.at(-1)).toBe("Notas generales");
    expect(ORDEN_BLOQUE_ENTREGA_DETALLE).not.toContain("Prioridad");
    expect(ORDEN_BLOQUE_ENTREGA_DETALLE).not.toContain("Moneda");

    render(
      <OrdenVentaDetalleDatosPedidoEntrega
        orden={ordenStub}
        clienteNombre="Cliente Demo"
        ordenCompraHotel="OC-9"
        folioFactura="F-1"
        centroConsumo="Banquetes"
        referenciaPedido="REF-1"
        moneda="USD"
        fechaEntrega="2026-11-12"
        ventanaEntrega="06:00 – 09:00"
        contacto="Ana"
        telefono="555"
        correo="a@b.com"
        direccion="Calle 1"
        notasGenerales="Dejar en cocina"
      />,
    );

    expect(screen.getByText("Moneda")).toBeTruthy();
    expect(screen.getByText("USD")).toBeTruthy();
    expect(screen.queryByText("Prioridad")).toBeNull();
    expect(screen.getByText("Hora desde")).toBeTruthy();
    expect(screen.getByText("Hora hasta")).toBeTruthy();
    expect(screen.getByText("06:00")).toBeTruthy();
    expect(screen.getByText("09:00")).toBeTruthy();
    expect(screen.queryByText("Ventana de entrega")).toBeNull();

    const notas = screen.getByText("Notas generales");
    const direccion = screen.getByText("Dirección de entrega");
    expect(
      notas.compareDocumentPosition(direccion) &
        Node.DOCUMENT_POSITION_PRECEDING,
    ).toBeTruthy();
  });
});
