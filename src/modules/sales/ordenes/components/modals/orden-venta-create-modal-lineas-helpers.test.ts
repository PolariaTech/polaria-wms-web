import { describe, expect, it } from "vitest";
import {
  collectSugerenciasLinea,
  formatProductoNombreConSku,
} from "./orden-venta-create-modal-lineas-helpers";

describe("orden-venta-create-modal-lineas-helpers", () => {
  it("formatProductoNombreConSku agrega sku", () => {
    expect(formatProductoNombreConSku("Pepino", "105")).toBe("Pepino (105)");
  });

  it("collectSugerenciasLinea deduplica", () => {
    const sug = {
      idProducto: "p1",
      nombre: "A",
      codigo: "1",
      idBodega: "b",
      kgDisponible: 1,
      unidadMedida: "KGM",
      precioUnitario: 1,
    };
    expect(
      collectSugerenciasLinea({
        idProducto: "",
        nombre: "",
        codigo: "",
        idBodega: "",
        cantidadInput: "",
        cajasInput: "",
        presentacion: "",
        especificacion: "",
        descuentoPctInput: "",
        ivaPct: "0",
        kgDisponible: 0,
        unidadMedida: "KGM",
        precioUnitario: 0,
        precioInput: "",
        sugerencia: sug,
        sugerenciasAlternativas: [sug],
      }),
    ).toHaveLength(1);
  });
});
