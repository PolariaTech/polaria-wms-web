import { describe, expect, it } from "vitest";
import {
  codigoCoincideEnQuery,
  coreProductNameForMatch,
  findClosestProductoCatalogo,
  findTypoRivalProductos,
  matchesProductoCatalogSearch,
  productNamesLooselyMatch,
  productoCompatibleConTextoCliente,
  rankProductosCatalogo,
  scoreProductoMatch,
  shouldAutoAcceptProductoSuggestion,
} from "./find-closest-producto-catalogo";
import type { ProductoVentaOption } from "../../../shared/types/sales.types";

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

describe("codigoCoincideEnQuery", () => {
  it("no deja que SKU '5' gane por estar dentro de '25 cm'", () => {
    expect(
      codigoCoincideEnQuery("PLATANO MACHO DE 20 A 25 CM ACOE", "5"),
    ).toBe(false);
    expect(codigoCoincideEnQuery("pedido codigo 5 listo", "5")).toBe(true);
  });

  it("no deja que SKU '5' gane por 'galón de 5 litros'", () => {
    expect(
      codigoCoincideEnQuery("Jugo de Limón fresco galón de 5 litros", "5"),
    ).toBe(false);
  });

  it("sigue reconociendo SKUs largos en el texto", () => {
    expect(
      codigoCoincideEnQuery("LECHUGA ROMANA 115001434", "115001434"),
    ).toBe(true);
  });
});

describe("limón fruta vs jugo de limón", () => {
  const limonPersa: ProductoVentaOption = {
    idProducto: "persa",
    label: "LIMON PERSA (SIN SEMILLA) (115001400)",
    idCliente: null,
    idBodega: "b1",
    codigo: "115001400",
    nombre: "LIMON PERSA (SIN SEMILLA)",
    kgDisponible: 100,
    precioUnitario: 23,
    unidadMedida: "KGM",
  };
  const jugoLimon: ProductoVentaOption = {
    idProducto: "jugo",
    label: "JUGO DE LIMON (105001548)",
    idCliente: null,
    idBodega: "b1",
    codigo: "105001548",
    nombre: "JUGO DE LIMON",
    kgDisponible: 40,
    precioUnitario: 70,
    unidadMedida: "LTR",
  };

  it("LIMON PERSA SIN SEMILLA elige fruta, no jugo", () => {
    const query = "LIMON PERSA - VERDE SIN SEMILLA";
    const match = findClosestProductoCatalogo(query, [jugoLimon, limonPersa]);
    expect(match?.idProducto).toBe("persa");
    expect(
      productoCompatibleConTextoCliente(query, jugoLimon),
    ).toBe(false);
  });

  it("jugo de limón sigue eligiendo JUGO, no la fruta", () => {
    const query = "Jugo de Limón fresco galón de 5 litros";
    const match = findClosestProductoCatalogo(query, [limonPersa, jugoLimon]);
    expect(match?.idProducto).toBe("jugo");
  });
});

describe("ANTICIPO vs jugo de limón", () => {
  it("elige JUGO DE LIMON y no ANTICIPO", () => {
    const catalogo: ProductoVentaOption[] = [
      {
        idProducto: "anticipo",
        label: "ANTICIPO DEL BIEN O SERVICIO (5)",
        idCliente: null,
        idBodega: "b1",
        codigo: "5",
        nombre: "ANTICIPO DEL BIEN O SERVICIO",
        kgDisponible: 0,
        precioUnitario: 0,
        unidadMedida: "ACT",
      },
      {
        idProducto: "jugo",
        label: "JUGO DE LIMON (105001548)",
        idCliente: null,
        idBodega: "b1",
        codigo: "105001548",
        nombre: "JUGO DE LIMON",
        kgDisponible: 40,
        precioUnitario: 70,
        unidadMedida: "LTR",
      },
    ];
    const query = "Jugo de Limón fresco galón de 5 litros";
    const match = findClosestProductoCatalogo(query, catalogo);
    expect(match?.idProducto).toBe("jugo");
    expect(
      shouldAutoAcceptProductoSuggestion({
        query,
        sugerenciaNombre: "ANTICIPO DEL BIEN O SERVICIO",
        sugerenciaCodigo: "5",
        topScore: 0.95,
        secondScore: 0.4,
        ambiguous: false,
      }),
    ).toBe(false);
  });
});

describe("findClosestProductoCatalogo", () => {
  it("no elige ANTICIPO (SKU 5) por tallas como 25 cm", () => {
    const conAnticipo: ProductoVentaOption[] = [
      {
        idProducto: "anticipo",
        label: "ANTICIPO DEL BIEN O SERVICIO (5)",
        idCliente: null,
        idBodega: "b1",
        codigo: "5",
        nombre: "ANTICIPO DEL BIEN O SERVICIO",
        kgDisponible: 0,
        precioUnitario: 0,
        unidadMedida: "ACT",
      },
      {
        idProducto: "platano",
        label: "PLATANO MACHO (105001523)",
        idCliente: null,
        idBodega: "b1",
        codigo: "105001523",
        nombre: "PLATANO MACHO",
        kgDisponible: 50,
        precioUnitario: 27,
        unidadMedida: "KGM",
      },
    ];
    const query = "PLATANO MACHO DE 20 A 25 CM ACOE";
    expect(scoreProductoMatch(query, conAnticipo[0]!)).toBeLessThan(0.5);
    expect(scoreProductoMatch(query, conAnticipo[1]!)).toBeGreaterThan(0.5);
    const match = findClosestProductoCatalogo(query, conAnticipo);
    expect(match?.idProducto).toBe("platano");
    const ranked = rankProductosCatalogo(query, conAnticipo);
    expect(ranked.best?.idProducto).toBe("platano");
    expect(
      shouldAutoAcceptProductoSuggestion({
        query,
        sugerenciaNombre: ranked.best!.nombre,
        sugerenciaCodigo: ranked.best!.codigo,
        topScore: ranked.candidates[0]!.score,
        secondScore: ranked.candidates[1]?.score ?? null,
        ambiguous: ranked.ambiguous,
      }),
    ).toBe(true);
  });

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

  it("sugiere AGUACATE JASS → Hass aunque el nombre del catálogo sea largo", () => {
    const catalogoLargo: ProductoVentaOption[] = [
      {
        idProducto: "p-long",
        label:
          "AGUACATE HASS EXTRA CALIBRE 200 A 250 G PIEZA PREMIUM BODEGA CUN (115001005)",
        idCliente: null,
        idBodega: "b1",
        codigo: "115001005",
        nombre:
          "AGUACATE HASS EXTRA CALIBRE 200 A 250 G PIEZA PREMIUM BODEGA CUN",
        kgDisponible: 40,
        precioUnitario: 78,
        unidadMedida: "kg",
      },
      {
        idProducto: "p-fresa",
        label: "FRESA FRESCA (X200012100)",
        idCliente: null,
        idBodega: "b1",
        codigo: "X200012100",
        nombre: "FRESA FRESCA",
        kgDisponible: 10,
        precioUnitario: 120,
        unidadMedida: "kg",
      },
    ];
    const ranked = rankProductosCatalogo("AGUACATE JASS", catalogoLargo);
    expect(ranked.best?.idProducto).toBe("p-long");
    expect(ranked.candidates[0]?.score ?? 0).toBeGreaterThanOrEqual(0.22);
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
