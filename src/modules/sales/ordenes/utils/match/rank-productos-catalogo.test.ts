import { describe, expect, it } from "vitest";
import type { ProductoVentaOption } from "../../../shared/types/sales.types";
import { rankProductosCatalogo } from "./rank-productos-catalogo";

const productos: ProductoVentaOption[] = [
  {
    idProducto: "p1",
    label: "Aguacate Hass",
    idCliente: null,
    idBodega: "b1",
    codigo: "SKU-1",
    nombre: "Aguacate Hass",
    kgDisponible: 100,
    precioUnitario: 50,
    unidadMedida: "kg",
  },
];

describe("rank-productos-catalogo", () => {
  it("rankea el mejor candidato", () => {
    const r = rankProductosCatalogo("aguacate hass", productos);
    expect(r.best?.idProducto).toBe("p1");
    expect(r.ambiguous).toBe(false);
  });
});