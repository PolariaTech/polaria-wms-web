import { describe, expect, it } from "vitest";
import type { ProductoVentaOption } from "../../../shared/types/sales.types";
import { productoCompatibleConTextoCliente } from "./producto-compatible-con-texto-cliente";

const aguacate: ProductoVentaOption = {
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

describe("producto-compatible-con-texto-cliente", () => {
  it("acepta texto alineado con el catálogo", () => {
    expect(productoCompatibleConTextoCliente("aguacate hass", aguacate)).toBe(true);
  });
});