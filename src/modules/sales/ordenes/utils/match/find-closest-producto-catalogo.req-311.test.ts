import { describe, expect, it } from "vitest";
import type { ProductoVentaOption } from "../../../shared/types/sales.types";
import { productoCompatibleConTextoCliente } from "./find-closest-producto-catalogo";

describe("find-closest REQ-311", () => {
  it("pimiento rojo no es compatible con PULPA DE FRUTOS ROJOS", () => {
    const pulpa: ProductoVentaOption = {
      idProducto: "pulpa",
      label: "PULPA DE FRUTOS ROJOS (115001418)",
      idCliente: null,
      idBodega: "b1",
      codigo: "115001418",
      nombre: "PULPA DE FRUTOS ROJOS",
      kgDisponible: 10,
      precioUnitario: 80,
      unidadMedida: "KGM",
    };
    expect(
      productoCompatibleConTextoCliente(
        "Pimiento morrón ROJO por kilo",
        pulpa,
      ),
    ).toBe(false);
  });
});
