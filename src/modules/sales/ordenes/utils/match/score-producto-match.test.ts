import { describe, expect, it } from "vitest";
import type { ProductoVentaOption } from "../../../shared/types/sales.types";
import { scoreProductoMatch } from "./score-producto-match";

const producto: ProductoVentaOption = {
  idProducto: "p1",
  label: "Aguacate Hass",
  idCliente: null,
  idBodega: "b1",
  codigo: "SKU-1",
  nombre: "Aguacate Hass",
  kgDisponible: 100,
  precioUnitario: 50,
  unidadMedida: "kg",
};

describe("score-producto-match", () => {
  it("puntúa match exacto en 1", () => {
    expect(scoreProductoMatch("aguacate hass", producto)).toBe(1);
  });
});