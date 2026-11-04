/**
 * Layout detalle OV (REQ-215/216/254).
 */
import { describe, expect, it } from "vitest";
import {
  ORDEN_BLOQUE_ENTREGA_DETALLE,
  ordenBloqueEntregaEsCorrecto,
} from "./orden-campos-datos-pedido";

const LABELS_DATOS_PEDIDO_DETALLE = [
  "Cliente",
  "Código de cliente",
  "Denominación comercial",
  "Orden de compra del cliente",
  "Folio de factura",
  "Centro de consumo",
  "Referencia de pedido",
  "Fecha de creación",
  "Estado",
] as const;

describe("OrdenVentaDetalleModal", () => {
  it("Datos del pedido ya no incluye Notas ni logística (REQ-254)", () => {
    expect(LABELS_DATOS_PEDIDO_DETALLE).not.toContain("Notas generales");
    expect(LABELS_DATOS_PEDIDO_DETALLE).not.toContain("Fecha de entrega");
    expect(LABELS_DATOS_PEDIDO_DETALLE).not.toContain("Prioridad");
  });

  it("Entrega: Notas → Prioridad → Moneda → Fecha → Ventana → dirección (REQ-254)", () => {
    expect(ordenBloqueEntregaEsCorrecto(ORDEN_BLOQUE_ENTREGA_DETALLE)).toBe(
      true,
    );
  });
});
