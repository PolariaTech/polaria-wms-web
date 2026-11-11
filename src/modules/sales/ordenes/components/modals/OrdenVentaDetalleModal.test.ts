/**
 * Layout detalle OV (REQ-305 alineado a edición REQ-278).
 */
import { describe, expect, it } from "vitest";
import {
  LABELS_DATOS_PEDIDO_DETALLE,
  ORDEN_BLOQUE_ENTREGA_DETALLE,
  ORDEN_TRAS_NOTAS_GENERALES_DETALLE,
  ordenBloqueEntregaEsCorrecto,
} from "./orden-campos-datos-pedido";

describe("OrdenVentaDetalleModal", () => {
  it("Datos del pedido incluye moneda y no prioridad ni logística (REQ-305)", () => {
    expect(LABELS_DATOS_PEDIDO_DETALLE).toContain("Moneda");
    expect(LABELS_DATOS_PEDIDO_DETALLE).not.toContain("Notas generales");
    expect(LABELS_DATOS_PEDIDO_DETALLE).not.toContain("Fecha de entrega");
    expect(LABELS_DATOS_PEDIDO_DETALLE).not.toContain("Prioridad");
  });

  it("Entrega: fecha/horas → contacto → dirección → notas (REQ-305)", () => {
    expect(ordenBloqueEntregaEsCorrecto(ORDEN_BLOQUE_ENTREGA_DETALLE)).toBe(
      true,
    );
    expect([...ORDEN_TRAS_NOTAS_GENERALES_DETALLE]).toEqual([
      "Fecha de entrega",
      "Día de la semana",
      "Hora desde",
      "Hora hasta",
    ]);
  });
});
