import { describe, expect, it } from "vitest";
import { matchesProductoCatalogSearch, rankProductosCatalogo, shouldAutoAcceptProductoSuggestion } from "./find-closest-producto-catalogo";
import type { ProductoVentaOption } from "../../../shared/types/sales.types";


describe("rankProductosCatalogo", () => {
  it("auto-asigna si el código del PDF está en el query", () => {
    expect(
      shouldAutoAcceptProductoSuggestion({
        query: "CEBOLLA BLANCA (115001413)",
        sugerenciaNombre: "CEBOLLA BLANCA",
        sugerenciaCodigo: "115001413",
        topScore: 0.9,
        secondScore: 0.8,
        ambiguous: true,
      }),
    ).toBe(true);
  });
});

describe("match parcial de familia (genérico)", () => {
  const lechugas: ProductoVentaOption[] = [
    {
      idProducto: "it",
      label: "LECHUGA ITALIANA",
      idCliente: null,
      idBodega: "b1",
      codigo: "115001445",
      nombre: "LECHUGA ITALIANA",
      kgDisponible: 10,
      precioUnitario: 1,
      unidadMedida: "kg",
    },
    {
      idProducto: "or",
      label: "LECHUGA OREJONA",
      idCliente: null,
      idBodega: "b1",
      codigo: "115001433",
      nombre: "LECHUGA OREJONA",
      kgDisponible: 10,
      precioUnitario: 1,
      unidadMedida: "kg",
    },
    {
      idProducto: "ro",
      label: "LECHUGA ROMANA",
      idCliente: null,
      idBodega: "b1",
      codigo: "115001434",
      nombre: "LECHUGA ROMANA",
      kgDisponible: 10,
      precioUnitario: 1,
      unidadMedida: "kg",
    },
    {
      idProducto: "sa",
      label: "LECHUGA SANGRIA",
      idCliente: null,
      idBodega: "b1",
      codigo: "115001432",
      nombre: "LECHUGA SANGRIA",
      kgDisponible: 10,
      precioUnitario: 1,
      unidadMedida: "kg",
    },
  ];

  const aguacates: ProductoVentaOption[] = [
    {
      idProducto: "ae",
      label: "AGUACATE EXTRA",
      idCliente: null,
      idBodega: "b1",
      codigo: "A1",
      nombre: "AGUACATE EXTRA",
      kgDisponible: 10,
      precioUnitario: 1,
      unidadMedida: "kg",
    },
    {
      idProducto: "ap",
      label: "AGUACATE PRIMERA",
      idCliente: null,
      idBodega: "b1",
      codigo: "A2",
      nombre: "AGUACATE PRIMERA",
      kgDisponible: 10,
      precioUnitario: 1,
      unidadMedida: "kg",
    },
    {
      idProducto: "as",
      label: "AGUACATE SEGUNDA",
      idCliente: null,
      idBodega: "b1",
      codigo: "A3",
      nombre: "AGUACATE SEGUNDA",
      kgDisponible: 10,
      precioUnitario: 1,
      unidadMedida: "kg",
    },
  ];

  it("pedido con familia + palabra desconocida: lista toda la familia y no auto-asigna", () => {
    const ranked = rankProductosCatalogo("LECHUGA LARGA", lechugas);
    const ids = ranked.candidates.map((c) => c.producto.idProducto);
    expect(ids).toEqual(expect.arrayContaining(["it", "or", "ro", "sa"]));
    expect(ranked.ambiguous).toBe(true);
    expect(
      shouldAutoAcceptProductoSuggestion({
        query: "LECHUGA LARGA",
        sugerenciaNombre: ranked.best!.nombre,
        sugerenciaCodigo: ranked.best!.codigo,
        topScore: ranked.candidates[0]!.score,
        secondScore: ranked.candidates[1]?.score ?? null,
        ambiguous: ranked.ambiguous,
      }),
    ).toBe(false);
  });

  it("mismo patrón en otra familia (aguacate + apodo)", () => {
    const ranked = rankProductosCatalogo("AGUACATE PARA ENSALADA", aguacates);
    expect(ranked.candidates.map((c) => c.producto.idProducto)).toEqual(
      expect.arrayContaining(["ae", "ap", "as"]),
    );
    expect(ranked.ambiguous).toBe(true);
    expect(
      shouldAutoAcceptProductoSuggestion({
        query: "AGUACATE PARA ENSALADA",
        sugerenciaNombre: ranked.best!.nombre,
        sugerenciaCodigo: ranked.best!.codigo,
        topScore: ranked.candidates[0]!.score,
        secondScore: ranked.candidates[1]?.score ?? null,
        ambiguous: ranked.ambiguous,
      }),
    ).toBe(false);
  });

  it("nombre exacto de variante no expande ni queda ambiguo", () => {
    const ranked = rankProductosCatalogo("LECHUGA OREJONA", lechugas);
    expect(ranked.best?.idProducto).toBe("or");
    expect(ranked.ambiguous).toBe(false);
  });

  it("buscador por tokens: familia+apodo encuentra variantes del catálogo", () => {
    expect(
      matchesProductoCatalogSearch("lechuga larga", {
        nombre: "LECHUGA OREJONA",
        codigo: "115001433",
      }),
    ).toBe(true);
    expect(
      matchesProductoCatalogSearch("aguacate ensalada", {
        nombre: "AGUACATE EXTRA",
        codigo: "A1",
      }),
    ).toBe(true);
    expect(
      matchesProductoCatalogSearch("lechuga larga", {
        nombre: "PLATANO MACHO",
        codigo: "105001523",
      }),
    ).toBe(false);
  });
});

