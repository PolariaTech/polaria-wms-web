import { describe, expect, it } from "vitest";
import type { ProductoVentaOption } from "../../../shared/types/sales.types";
import { productoCompatibleConTextoCliente } from "./find-closest-producto-catalogo";
import { shouldAutoAcceptProductoSuggestion } from "./should-auto-accept-producto";

const romana: ProductoVentaOption = {
  idProducto: "ro",
  label: "LECHUGA ROMANA",
  idCliente: null,
  idBodega: "b1",
  codigo: "115001434",
  nombre: "LECHUGA ROMANA",
  kgDisponible: 10,
  precioUnitario: 27,
  unidadMedida: "kg",
};

const mediano: ProductoVentaOption = {
  idProducto: "am",
  label: "AGUACATE MEDIANO (140 a 170g)",
  idCliente: null,
  idBodega: "b1",
  codigo: "115001013",
  nombre: "AGUACATE MEDIANO (140 a 170g)",
  kgDisponible: 10,
  precioUnitario: 45,
  unidadMedida: "kg",
};

describe("REQ-369 falsos positivos de match seguro", () => {
  it("no auto-asigna LECHUGA LARGA → LECHUGA ROMANA", () => {
    expect(productoCompatibleConTextoCliente("LECHUGA LARGA", romana)).toBe(
      false,
    );
    expect(
      shouldAutoAcceptProductoSuggestion({
        query: "LECHUGA LARGA",
        sugerenciaNombre: romana.nombre,
        sugerenciaCodigo: romana.codigo,
        topScore: 0.58,
        secondScore: null,
        ambiguous: false,
      }),
    ).toBe(false);
  });

  it("no auto-asigna AGUACATE HASS 210–230 → MEDIANO 140–170", () => {
    expect(
      productoCompatibleConTextoCliente(
        "AGUACATE HASS DE 210 A 230 GR",
        mediano,
      ),
    ).toBe(false);
    expect(
      shouldAutoAcceptProductoSuggestion({
        query: "AGUACATE HASS DE 210 A 230 GR",
        sugerenciaNombre: mediano.nombre,
        sugerenciaCodigo: mediano.codigo,
        topScore: 0.58,
        secondScore: null,
        ambiguous: false,
      }),
    ).toBe(false);
  });

  it("orejona↔romana (sinónimo Mateo) sigue compatible", () => {
    expect(productoCompatibleConTextoCliente("LECHUGA OREJONA", romana)).toBe(
      true,
    );
  });
});
