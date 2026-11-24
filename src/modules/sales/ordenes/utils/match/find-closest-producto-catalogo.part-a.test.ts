import { describe, expect, it } from "vitest";
import { codigoCoincideEnQuery, findClosestProductoCatalogo, productoCompatibleConTextoCliente, rankProductosCatalogo, scoreProductoMatch, shouldAutoAcceptProductoSuggestion } from "./find-closest-producto-catalogo";
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
});

