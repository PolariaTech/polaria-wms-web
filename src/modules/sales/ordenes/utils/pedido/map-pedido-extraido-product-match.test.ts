import { describe, expect, it } from "vitest";
import { pickSugerencias, toSugerencia } from "./map-pedido-extraido-product-match";
import type { ProductoVentaOption } from "../../../shared/types/sales.types";

const producto = (overrides: Partial<ProductoVentaOption> = {}): ProductoVentaOption => ({
  idProducto: "p1",
  nombre: "AGUACATE HASS",
  codigo: "115001005",
  idBodega: "b1",
  kgDisponible: 100,
  unidadMedida: "kg",
  precioUnitario: 50,
  ...overrides,
});

describe("map-pedido-extraido-product-match", () => {
  it("toSugerencia expone campos del catálogo", () => {
    const sug = toSugerencia(producto());
    expect(sug.idProducto).toBe("p1");
    expect(sug.codigo).toBe("115001005");
  });

  it("pickSugerencias sin query devuelve vacío", () => {
    const picked = pickSugerencias({ textoOriginal: "", productoCatalogo: null }, []);
    expect(picked.sugerencia).toBeNull();
  });
});