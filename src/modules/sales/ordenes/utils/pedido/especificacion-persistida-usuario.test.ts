import { describe, expect, it } from "vitest";
import {
  buildNotasLineasText,
  notaCapturaForLinea,
} from "./build-orden-venta-captura-observaciones";

describe("especificacion editada por usuario (REQ-287)", () => {
  it("persiste la corrección del usuario y se relee para form/PDF", () => {
    const guardado = buildNotasLineasText([
      {
        nombre: "AGUACATE EXTRA",
        cantidad: 2,
        otId: "ot-1",
        idProducto: "id-aguacate",
        especificacion: "Madurez: Pintón (corregido)",
      },
    ]);
    expect(
      notaCapturaForLinea(guardado, {
        nombre: "AGUACATE EXTRA (200 a 260g)",
        cantidad: 2,
        otId: "ot-1",
        idProducto: "id-aguacate",
      }),
    ).toBe("Madurez: Pintón (corregido)");
  });

  it("si el usuario borra la especificación, al reabrir queda vacío", () => {
    const vacio = buildNotasLineasText([
      {
        nombre: "AGUACATE EXTRA",
        cantidad: 2,
        idProducto: "id-aguacate",
        especificacion: "",
      },
    ]);
    expect(
      notaCapturaForLinea(vacio, {
        nombre: "AGUACATE EXTRA",
        cantidad: 2,
        idProducto: "id-aguacate",
      }),
    ).toBe("");
  });
});
