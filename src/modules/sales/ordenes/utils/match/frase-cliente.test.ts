import { describe, expect, it } from "vitest";
import type { ProductoVentaOption } from "../../../shared/types/sales.types";
import {
  indiceFrasesCliente,
  productoPorFraseCliente,
} from "./frase-cliente";

function productoVenta(
  parcial: Pick<ProductoVentaOption, "idProducto" | "codigo" | "nombre"> & {
    frasesCliente?: readonly string[];
  },
): ProductoVentaOption & { frasesCliente?: readonly string[] } {
  return {
    label: `${parcial.nombre} (${parcial.codigo})`,
    idCliente: null,
    idBodega: "b1",
    kgDisponible: 10,
    precioUnitario: 1,
    unidadMedida: "kg",
    ...parcial,
  };
}

const GRANNY = productoVenta({
  idProducto: "p-granny",
  codigo: "115001010",
  nombre: "MANZANA GRANNY SMITH",
  frasesCliente: ["Manzana verde"],
});
const AJO = productoVenta({
  idProducto: "p-ajo",
  codigo: "115001201",
  nombre: "AJO",
  frasesCliente: ["Ajo en bote"],
});
const AGUACATE_PRIMERA = productoVenta({
  idProducto: "p-aguacate-primera",
  codigo: "115001009",
  nombre: "AGUACATE PRIMERA",
  frasesCliente: ["aguacate hass"],
});
const AGUACATE_EXTRA = productoVenta({
  idProducto: "p-aguacate-extra",
  codigo: "115001005",
  nombre: "AGUACATE EXTRA",
  frasesCliente: ["Aguacate Hass"],
});

describe("indiceFrasesCliente y productoPorFraseCliente", () => {
  it("asigna el producto cuando la frase es única", () => {
    const indice = indiceFrasesCliente([GRANNY, AJO]);
    expect(productoPorFraseCliente("Manzana verde", indice)?.idProducto).toBe(
      "p-granny",
    );
    expect(productoPorFraseCliente("ajo  EN-bote", indice)?.idProducto).toBe(
      "p-ajo",
    );
  });

  it("no asigna cuando la misma frase apunta a dos productos", () => {
    const indice = indiceFrasesCliente([AGUACATE_PRIMERA, AGUACATE_EXTRA]);
    expect(productoPorFraseCliente("aguacate hass", indice)).toBeNull();
  });

  it("ignora frases vacías y no asigna texto vacío", () => {
    const conVacias = productoVenta({
      idProducto: "p-granny",
      codigo: "115001010",
      nombre: "MANZANA GRANNY SMITH",
      frasesCliente: ["", "   ", "Manzana verde"],
    });
    const indice = indiceFrasesCliente([conVacias]);
    expect(indice.has("")).toBe(false);
    expect(productoPorFraseCliente("", indice)).toBeNull();
    expect(productoPorFraseCliente("   ", indice)).toBeNull();
    expect(productoPorFraseCliente("Manzana verde", indice)?.idProducto).toBe(
      "p-granny",
    );
  });

  it("no asigna una frase de un producto que no está en la lista", () => {
    const indice = indiceFrasesCliente([GRANNY]);
    expect(productoPorFraseCliente("Ajo en bote", indice)).toBeNull();
    expect(productoPorFraseCliente("Manzana verde", indice)?.idProducto).toBe(
      "p-granny",
    );
  });
});
