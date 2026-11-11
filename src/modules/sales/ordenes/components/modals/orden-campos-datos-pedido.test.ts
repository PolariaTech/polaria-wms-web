import { describe, expect, it } from "vitest";
import {
  ORDEN_BLOQUE_ENTREGA_DETALLE,
  ORDEN_TRAS_NOTAS_GENERALES,
  ORDEN_TRAS_NOTAS_GENERALES_DETALLE,
  ordenBloqueEntregaEsCorrecto,
  ordenTrasNotasEsCorrecto,
} from "./orden-campos-datos-pedido";

describe("orden logística OV (REQ-278)", () => {
  it("programación: Fecha → Día → Hora desde → Hora hasta", () => {
    expect([...ORDEN_TRAS_NOTAS_GENERALES]).toEqual([
      "Fecha de entrega",
      "Día de la semana",
      "Hora desde",
      "Hora hasta",
    ]);
    expect(
      ordenTrasNotasEsCorrecto(
        [...ORDEN_TRAS_NOTAS_GENERALES],
        ORDEN_TRAS_NOTAS_GENERALES,
      ),
    ).toBe(true);
  });

  it("bloque Entrega: fechas/horas, contacto, dirección y notas al final", () => {
    expect(ORDEN_BLOQUE_ENTREGA_DETALLE.at(-1)).toBe("Notas generales");
    expect(ordenBloqueEntregaEsCorrecto(ORDEN_BLOQUE_ENTREGA_DETALLE)).toBe(
      true,
    );
    expect(ORDEN_TRAS_NOTAS_GENERALES_DETALLE).toEqual([
      "Fecha de entrega",
      "Día de la semana",
      "Hora desde",
      "Hora hasta",
    ]);
  });
});
