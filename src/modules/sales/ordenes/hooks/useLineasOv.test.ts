import { describe, expect, it } from "vitest";
import type { LineaVentaForm } from "../types/orden-venta-create-modal.types";
import type { ProductoVentaOption } from "../../shared/types/sales.types";
import {
  actualizarSugerenciasDeCatalogo,
  crearLineaDesdeProducto,
} from "./useLineasOv";

function linea(partial: Partial<LineaVentaForm> = {}): LineaVentaForm {
  return {
    idProducto: "",
    nombre: "Aguacate hass",
    codigo: "",
    idBodega: "",
    cantidadInput: "",
    cajasInput: "",
    presentacion: "",
    especificacion: "",
    ivaPct: "0",
    kgDisponible: 0,
    unidadMedida: "",
    precioUnitario: 0,
    precioInput: "",
    catalogPending: true,
    aliasCliente: "Aguacate hass",
    ...partial,
  };
}

function producto(): ProductoVentaOption {
  return {
    idProducto: "p1",
    label: "Aguacate (AGU)",
    idCliente: null,
    idBodega: "b1",
    codigo: "AGU",
    nombre: "Aguacate hass",
    kgDisponible: 8,
    precioUnitario: 40,
    unidadMedida: "kg",
  };
}

describe("actualizarSugerenciasDeCatalogo", () => {
  it("no cambia la referencia si la línea ya tiene producto", () => {
    const prev = [linea({ catalogPending: false, idProducto: "p9" })];
    expect(actualizarSugerenciasDeCatalogo(prev, [producto()])).toBe(prev);
  });
});

describe("crearLineaDesdeProducto", () => {
  it("arma una línea vacía de cantidad con el producto elegido", () => {
    const next = crearLineaDesdeProducto(producto(), "ot-1");
    expect(next.idProducto).toBe("p1");
    expect(next.otId).toBe("ot-1");
    expect(next.cantidadInput).toBe("");
    expect(next.catalogPending).toBe(false);
  });
});
