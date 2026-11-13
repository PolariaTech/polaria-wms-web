import { describe, expect, it } from "vitest";
import type { LineaVentaForm } from "../../types/orden-venta-create-modal.types";
import type { ProductoVentaOption } from "../../../shared/types/sales.types";
import { applyProductoToLinea } from "./orden-venta-create-helpers";

function linea(partial: Partial<LineaVentaForm> = {}): LineaVentaForm {
  return {
    idProducto: "",
    nombre: "Manzana verde",
    codigo: "",
    idBodega: "",
    cantidadInput: "1",
    cajasInput: "",
    presentacion: "",
    especificacion: "",
    descuentoPctInput: "",
    ivaPct: "0",
    kgDisponible: 0,
    unidadMedida: "kg",
    precioUnitario: 0,
    precioInput: "",
    catalogPending: true,
    aliasCliente: "Manzana verde",
    propuestaSistema: {
      producto: {
        idProducto: "p-granny",
        nombre: "MANZANA GRANNY SMITH",
        codigo: "115001010",
      },
      fuente: "frase",
    },
    ...partial,
  };
}

const producto: ProductoVentaOption = {
  idProducto: "p-red",
  label: "MANZANA RED DELICIOUS (R)",
  idCliente: null,
  idBodega: "b1",
  codigo: "R",
  nombre: "MANZANA RED DELICIOUS",
  kgDisponible: 8,
  precioUnitario: 12,
  unidadMedida: "kg",
};

describe("applyProductoToLinea conserva propuestaSistema", () => {
  it("no borra lo que propuso el sistema al elegir otro producto", () => {
    const next = applyProductoToLinea(linea(), producto);
    expect(next.idProducto).toBe("p-red");
    expect(next.propuestaSistema).toEqual({
      producto: {
        idProducto: "p-granny",
        nombre: "MANZANA GRANNY SMITH",
        codigo: "115001010",
      },
      fuente: "frase",
    });
  });
});
