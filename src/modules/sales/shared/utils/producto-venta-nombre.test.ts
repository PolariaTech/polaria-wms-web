import { describe, expect, it } from "vitest";
import {
  resolveNombreProductoVenta,
  stripLeadingProductoCodigo,
} from "./producto-venta-nombre";

describe("producto-venta-nombre", () => {
  it("quita el código del inicio del nombre", () => {
    expect(
      stripLeadingProductoCodigo("105001447 HONGO PORTOBELLO", "105001447"),
    ).toBe("HONGO PORTOBELLO");
  });

  it("deja el nombre intacto si no empieza con el código", () => {
    expect(stripLeadingProductoCodigo("HONGO PORTOBELLO", "105001447")).toBe(
      "HONGO PORTOBELLO",
    );
  });

  it("usa título de catálogo sin concatenar el sku", () => {
    expect(
      resolveNombreProductoVenta(
        {
          id_producto: "p-1",
          sku: "105001503",
          descripcion: "105001503 FRESAS",
          metadatos_catalogo: { titulo: "FRESAS" },
        },
        "105001503",
      ),
    ).toBe("FRESAS");
  });
});
