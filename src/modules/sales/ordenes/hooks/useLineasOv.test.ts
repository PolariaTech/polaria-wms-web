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
    descuentoPctInput: "",
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

function productoConFrase(): ProductoVentaOption {
  return {
    ...producto(),
    idProducto: "p-primera",
    codigo: "115001009",
    nombre: "AGUACATE PRIMERA",
    frasesCliente: ["Aguacate hass"],
  };
}

describe("actualizarSugerenciasDeCatalogo", () => {
  it("no cambia la referencia si la línea ya tiene producto", () => {
    const prev = [linea({ catalogPending: false, idProducto: "p9" })];
    expect(actualizarSugerenciasDeCatalogo(prev, [producto()])).toBe(prev);
  });

  it("una línea pendiente con frase queda asignada", () => {
    const prev = [linea({ filledByIa: true, catalogPending: true })];
    const next = actualizarSugerenciasDeCatalogo(prev, [productoConFrase()]);
    expect(next[0]?.idProducto).toBe("p-primera");
    expect(next[0]?.catalogPending).toBe(false);
    expect(next[0]?.filledByIa).toBe(true);
    expect(next[0]?.propuestaSistema?.fuente).toBe("frase");
  });

  it("una línea que tocó el usuario no cambia", () => {
    const prev = [
      linea({ filledByIa: false, catalogPending: true, idProducto: "" }),
    ];
    const next = actualizarSugerenciasDeCatalogo(prev, [productoConFrase()]);
    expect(next[0]?.idProducto).toBe("");
  });

  it("una línea asignada por búsqueda difusa pasa al de la frase", () => {
    const prev = [
      linea({
        filledByIa: true,
        catalogPending: false,
        idProducto: "p1",
        codigo: "AGU",
      }),
    ];
    const next = actualizarSugerenciasDeCatalogo(prev, [
      producto(),
      productoConFrase(),
    ]);
    expect(next[0]?.idProducto).toBe("p-primera");
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
