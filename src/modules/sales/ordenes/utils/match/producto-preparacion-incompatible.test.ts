import { describe, expect, it } from "vitest";
import type { ProductoVentaOption } from "../../../shared/types/sales.types";
import { productoPreparacionIncompatibleConTexto } from "./producto-preparacion-incompatible";

const base = (
  partial: Pick<ProductoVentaOption, "idProducto" | "nombre" | "codigo">,
): ProductoVentaOption => ({
  label: partial.nombre,
  idCliente: null,
  idBodega: "b1",
  kgDisponible: 10,
  precioUnitario: 1,
  unidadMedida: "KGM",
  ...partial,
});

describe("productoPreparacionIncompatibleConTexto", () => {
  it("fruta vs jugo son incompatibles", () => {
    expect(
      productoPreparacionIncompatibleConTexto(
        "limon persa",
        base({ idProducto: "j", nombre: "JUGO DE LIMON", codigo: "1" }),
      ),
    ).toBe(true);
  });

  it("REQ-311: pimiento fresco vs pulpa es incompatible", () => {
    expect(
      productoPreparacionIncompatibleConTexto(
        "Pimiento morrón ROJO",
        base({
          idProducto: "p",
          nombre: "PULPA DE FRUTOS ROJOS",
          codigo: "115001418",
        }),
      ),
    ).toBe(true);
  });

  it("frutos rojos puede mapear a pulpa", () => {
    expect(
      productoPreparacionIncompatibleConTexto(
        "Frutos rojos",
        base({
          idProducto: "p",
          nombre: "PULPA DE FRUTOS ROJOS",
          codigo: "115001418",
        }),
      ),
    ).toBe(false);
  });
});
