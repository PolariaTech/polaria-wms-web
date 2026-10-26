import { describe, expect, it } from "vitest";
import {
  buildNotasLineasText,
  notaCapturaForLinea,
} from "./build-orden-venta-captura-observaciones";
import { resolveCantidadPrecioParaPersistir } from "./persist-linea-avance";

describe("resolveCantidadPrecioParaPersistir (REQ-138)", () => {
  it("avance: precio y cantidad vacíos → 0 (permite guardar)", () => {
    expect(
      resolveCantidadPrecioParaPersistir({
        isDraft: true,
        cantidadInput: "",
        precioInput: "",
        nombreProducto: "JUGO",
      }),
    ).toEqual({ ok: true, cantidadPedida: 0, precioUnitario: 0 });
  });

  it("avance: conserva cantidad con precio vacío", () => {
    expect(
      resolveCantidadPrecioParaPersistir({
        isDraft: true,
        cantidadInput: "10",
        precioInput: "",
        nombreProducto: "JUGO",
      }),
    ).toEqual({ ok: true, cantidadPedida: 10, precioUnitario: 0 });
  });

  it("confirmar: bloquea precio vacío", () => {
    const result = resolveCantidadPrecioParaPersistir({
      isDraft: false,
      cantidadInput: "10",
      precioInput: "",
      nombreProducto: "JUGO",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/precio/i);
    }
  });

  it("confirmar: bloquea cantidad vacía", () => {
    const result = resolveCantidadPrecioParaPersistir({
      isDraft: false,
      cantidadInput: "",
      precioInput: "70",
      nombreProducto: "JUGO",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/cantidad/i);
    }
  });
});

describe("especificaciones en avance (REQ-138)", () => {
  it("round-trip: guardar avance y reabrir con otro nombre de catálogo", () => {
    const guardado = buildNotasLineasText([
      {
        nombre: "Jugo limón fresco galón",
        cantidad: 0,
        otId: "ot-cocina",
        idProducto: "id-jugo-548",
        especificacion: "2x galón de 5 litros",
      },
      {
        nombre: "Piña",
        cantidad: 2,
        otId: "ot-cocina",
        idProducto: "id-pina",
        especificacion: "SIN penacho",
      },
    ]);

    // Al reabrir el form usa nombre de catálogo distinto, misma OT + id.
    expect(
      notaCapturaForLinea(guardado, {
        nombre: "JUGO DE LIMON",
        cantidad: 10,
        otId: "ot-cocina",
        idProducto: "id-jugo-548",
      }),
    ).toBe("2x galón de 5 litros");

    expect(
      notaCapturaForLinea(guardado, {
        nombre: "PIÑA (105001508)",
        cantidad: 2,
        otId: "ot-cocina",
        idProducto: "id-pina",
      }),
    ).toBe("SIN penacho");
  });
});
