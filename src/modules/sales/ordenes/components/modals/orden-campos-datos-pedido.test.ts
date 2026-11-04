import { describe, expect, it } from "vitest";
import {
  ORDEN_BLOQUE_ENTREGA_DETALLE,
  ORDEN_TRAS_NOTAS_GENERALES,
  ORDEN_TRAS_NOTAS_GENERALES_DETALLE,
  ordenBloqueEntregaEsCorrecto,
  ordenTrasNotasEsCorrecto,
} from "./orden-campos-datos-pedido";

describe("orden logística OV (REQ-216 / REQ-254)", () => {
  it("tras Notas: Prioridad → Moneda → Fecha → Ventanas", () => {
    expect([...ORDEN_TRAS_NOTAS_GENERALES]).toEqual([
      "Prioridad",
      "Moneda",
      "Fecha de entrega",
      "Ventana de entrega — desde",
      "Ventana de entrega — hasta",
    ]);
    expect(
      ordenTrasNotasEsCorrecto(
        [...ORDEN_TRAS_NOTAS_GENERALES],
        ORDEN_TRAS_NOTAS_GENERALES,
      ),
    ).toBe(true);
  });

  it("bloque Entrega empieza por Notas y sigue el orden 216 (REQ-254)", () => {
    expect(ORDEN_BLOQUE_ENTREGA_DETALLE[0]).toBe("Notas generales");
    expect(
      ordenTrasNotasEsCorrecto(
        ORDEN_BLOQUE_ENTREGA_DETALLE.slice(1),
        ORDEN_TRAS_NOTAS_GENERALES_DETALLE,
      ),
    ).toBe(true);
    expect(ordenBloqueEntregaEsCorrecto(ORDEN_BLOQUE_ENTREGA_DETALLE)).toBe(
      true,
    );
  });
});
