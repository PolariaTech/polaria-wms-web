import { describe, expect, it } from "vitest";
import {
  coreProductNameForMatch,
  findClosestProductoCatalogo,
  findTypoRivalProductos,
  productNamesLooselyMatch,
  rankProductosCatalogo,
  shouldAutoAcceptProductoSuggestion,
} from "./find-closest-producto-catalogo";
import type { ProductoVentaOption } from "../../shared/types/sales.types";

const productos: ProductoVentaOption[] = [
  {
    idProducto: "p1",
    label: "Aguacate Hass (SKU-1)",
    idCliente: null,
    idBodega: "b1",
    codigo: "SKU-1",
    nombre: "Aguacate Hass",
    kgDisponible: 100,
    precioUnitario: 50,
    unidadMedida: "kg",
  },
  {
    idProducto: "p2",
    label: "Tomate Saladette (TOM01)",
    idCliente: null,
    idBodega: "b1",
    codigo: "TOM01",
    nombre: "Tomate Saladette",
    kgDisponible: 80,
    precioUnitario: 30,
    unidadMedida: "kg",
  },
  {
    idProducto: "p3",
    label: "CHILE JALAPEÑO DE 6 A 8 CM (JAL01)",
    idCliente: null,
    idBodega: "b1",
    codigo: "JAL01",
    nombre: "CHILE JALAPEÑO DE 6 A 8 CM",
    kgDisponible: 50,
    precioUnitario: 33,
    unidadMedida: "kg",
  },
  {
    idProducto: "p4",
    label: "CHILE JALAPEÑO DE 8 A 10 CM (JAL02)",
    idCliente: null,
    idBodega: "b1",
    codigo: "JAL02",
    nombre: "CHILE JALAPEÑO DE 8 A 10 CM",
    kgDisponible: 40,
    precioUnitario: 35,
    unidadMedida: "kg",
  },
  {
    idProducto: "p5",
    label: "Aguacate Extra Hass (SKU-2)",
    idCliente: null,
    idBodega: "b1",
    codigo: "SKU-2",
    nombre: "Aguacate Extra Hass",
    kgDisponible: 90,
    precioUnitario: 60,
    unidadMedida: "kg",
  },
];

describe("findClosestProductoCatalogo", () => {
  it("sugiere el producto más cercano por nombre", () => {
    const match = findClosestProductoCatalogo("aguacate hass premium", productos);
    expect(match?.idProducto).toBe("p1");
  });

  it("sugiere por código", () => {
    const match = findClosestProductoCatalogo("TOM01", productos);
    expect(match?.idProducto).toBe("p2");
  });

  it("devuelve null si no hay similitud razonable", () => {
    const match = findClosestProductoCatalogo("xyzzy foobar", productos);
    expect(match).toBeNull();
  });

  it("devuelve null con query vacía", () => {
    expect(findClosestProductoCatalogo("  ", productos)).toBeNull();
  });

  it("acepta prefijo truncado del tercero (AGUAC → Aguacate)", () => {
    const match = findClosestProductoCatalogo("AGUAC", productos);
    expect(match?.idProducto).toBe("p1");
  });

  it("normaliza mojibake ¥ de ñ en PI¥A", () => {
    const conPina: ProductoVentaOption[] = [
      ...productos,
      {
        idProducto: "p-pina",
        label: "PIÑA (PIN01)",
        idCliente: null,
        idBodega: "b1",
        codigo: "PIN01",
        nombre: "PIÑA",
        kgDisponible: 20,
        precioUnitario: 18,
        unidadMedida: "kg",
      },
    ];
    const match = findClosestProductoCatalogo("PI¥A MIEL", conPina);
    expect(match?.idProducto).toBe("p-pina");
  });
});

describe("rankProductosCatalogo", () => {
  it("marca ambiguo cuando hay tallas parecidas sin especificar", () => {
    const ranked = rankProductosCatalogo("chile jalapeño", productos);
    expect(ranked.candidates.length).toBeGreaterThanOrEqual(2);
    expect(ranked.ambiguous).toBe(true);
    expect(
      ranked.candidates.map((c) => c.producto.idProducto).sort(),
    ).toEqual(expect.arrayContaining(["p3", "p4"]));
  });

  it("elige la talla correcta cuando el documento la trae", () => {
    const ranked = rankProductosCatalogo(
      "chile jalapeño de 6 a 8 cm",
      productos,
    );
    expect(ranked.best?.idProducto).toBe("p3");
    expect(ranked.ambiguous).toBe(false);
  });

  it("prioriza variante más específica cuando el texto la nombra", () => {
    const ranked = rankProductosCatalogo("aguacate extra hass", productos);
    expect(ranked.best?.idProducto).toBe("p5");
  });

  it("devuelve hasta 3 candidatos ordenados", () => {
    const ranked = rankProductosCatalogo("aguacate", productos);
    expect(ranked.candidates.length).toBeGreaterThanOrEqual(2);
    expect(ranked.candidates.length).toBeLessThanOrEqual(3);
    const scores = ranked.candidates.map((c) => c.score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it("detecta rivales por typo jass/hass aunque el score exacto sea más alto", () => {
    const conTypo: ProductoVentaOption[] = [
      ...productos,
      {
        idProducto: "p-jass",
        label: "AGUACATE JASS (X200011700)",
        idCliente: null,
        idBodega: "b1",
        codigo: "X200011700",
        nombre: "AGUACATE JASS",
        kgDisponible: 0,
        precioUnitario: 78,
        unidadMedida: "kg",
      },
    ];
    const chosen = conTypo.find((p) => p.idProducto === "p-jass")!;
    const rivals = findTypoRivalProductos("AGUACATE JASS", chosen, conTypo);
    expect(rivals.some((r) => r.idProducto === "p1")).toBe(true);
  });

  it("entiende blue berry como arándanos/blueberries", () => {
    const berries: ProductoVentaOption[] = [
      ...productos,
      {
        idProducto: "p-blue",
        label: "ARÁNDANOS/BLUEBERRIES (105001507)",
        idCliente: null,
        idBodega: "b1",
        codigo: "105001507",
        nombre: "ARÁNDANOS/BLUEBERRIES",
        kgDisponible: 20,
        precioUnitario: 410,
        unidadMedida: "kg",
      },
      {
        idProducto: "p-framb",
        label: "FRAMBUESAS (105001506)",
        idCliente: null,
        idBodega: "b1",
        codigo: "105001506",
        nombre: "FRAMBUESAS",
        kgDisponible: 15,
        precioUnitario: 390,
        unidadMedida: "kg",
      },
      {
        idProducto: "p-fresa",
        label: "FRESAS (105001503)",
        idCliente: null,
        idBodega: "b1",
        codigo: "105001503",
        nombre: "FRESAS",
        kgDisponible: 30,
        precioUnitario: 195,
        unidadMedida: "kg",
      },
    ];

    expect(findClosestProductoCatalogo("blue berry", berries)?.idProducto).toBe(
      "p-blue",
    );
    expect(findClosestProductoCatalogo("BLUEBERRY", berries)?.idProducto).toBe(
      "p-blue",
    );
    expect(findClosestProductoCatalogo("arándanos", berries)?.idProducto).toBe(
      "p-blue",
    );
    expect(findClosestProductoCatalogo("FRAMBUESA", berries)?.idProducto).toBe(
      "p-framb",
    );
    expect(
      findClosestProductoCatalogo("FRESA FRESCA", berries)?.idProducto,
    ).toBe("p-fresa");
  });

  it("auto-acepta ZARZAMORA y no confunde con cebolla morada", () => {
    const catalog: ProductoVentaOption[] = [
      {
        idProducto: "z1",
        label: "ZARZAMORA (105001505)",
        idCliente: null,
        idBodega: "b1",
        codigo: "105001505",
        nombre: "ZARZAMORA",
        kgDisponible: 10,
        precioUnitario: 365,
        unidadMedida: "kg",
      },
      {
        idProducto: "z2",
        label: "ZARZAMORAS CONGELADAS (115001412)",
        idCliente: null,
        idBodega: "b1",
        codigo: "115001412",
        nombre: "ZARZAMORAS CONGELADAS",
        kgDisponible: 5,
        precioUnitario: 300,
        unidadMedida: "kg",
      },
      {
        idProducto: "c1",
        label: "CEBOLLA MORADA (10501516)",
        idCliente: null,
        idBodega: "b1",
        codigo: "10501516",
        nombre: "CEBOLLA MORADA",
        kgDisponible: 40,
        precioUnitario: 37,
        unidadMedida: "kg",
      },
    ];

    const ranked = rankProductosCatalogo("ZARZAMORA", catalog);
    expect(ranked.best?.idProducto).toBe("z1");
    expect(ranked.candidates.map((c) => c.producto.idProducto)).not.toContain(
      "c1",
    );
    expect(
      shouldAutoAcceptProductoSuggestion({
        query: "ZARZAMORA",
        sugerenciaNombre: "ZARZAMORA",
        sugerenciaCodigo: "105001505",
        topScore: ranked.candidates[0]!.score,
        secondScore: ranked.candidates[1]?.score ?? null,
        ambiguous: ranked.ambiguous,
      }),
    ).toBe(true);
  });

  it("productNamesLooselyMatch blue berry ↔ arándanos", () => {
    expect(
      productNamesLooselyMatch("BLUE BERRY", "ARÁNDANOS/BLUEBERRIES"),
    ).toBe(true);
    expect(productNamesLooselyMatch("FRESA FRESCA", "FRESAS")).toBe(true);
  });

  it("auto-asigna si es el mismo producto aunque cambien gramos (260 vs 250)", () => {
    expect(
      coreProductNameForMatch("AGUACATE EXTRA (200 a 260g)"),
    ).toBe(coreProductNameForMatch("AGUACATE EXTRA (200 a 250g)"));
    expect(
      shouldAutoAcceptProductoSuggestion({
        query: "AGUACATE EXTRA (200 a 260g)",
        sugerenciaNombre: "AGUACATE EXTRA (200 a 250g)",
        sugerenciaCodigo: "115001005",
        topScore: 0.88,
        secondScore: 0.72,
        ambiguous: true,
      }),
    ).toBe(true);
  });

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
