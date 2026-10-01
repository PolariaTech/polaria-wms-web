import { describe, expect, it } from "vitest";
import {
  groupOrigenCorreoToOrdenesTrabajo,
  type OrigenCorreoRenglon,
} from "./origen-correo-ordenes-trabajo";

const sampleMarina: OrigenCorreoRenglon[] = [
  {
    Fecha: "29/09/2026",
    Almacen: "COCINA PRINCIPAL",
    Cantidad: 8,
    Producto: "TOMATE SALADETTE",
    "Numero pedido": "387529",
    "Referencia pedido":
      "FYV BANQUETES PARA ENTREGA 29/09/2026 (AGUACATES PUEBLA)",
  },
  {
    Fecha: "29/09/2026",
    Almacen: "COCINA PRINCIPAL",
    Cantidad: 3,
    Producto: "CALABAZA ITALIANA",
    "Numero pedido": "387529",
    "Referencia pedido":
      "FYV BANQUETES PARA ENTREGA 29/09/2026 (AGUACATES PUEBLA)",
  },
  {
    Fecha: "29/09/2026",
    Almacen: "COCINA PRINCIPAL",
    Cantidad: 15,
    Producto: "LIMON SIN SEMILLA",
    "Numero pedido": "387537",
    "Referencia pedido":
      "FYV COMEDOR PARA ENTREGA 29/09/2026 (AGUACATES PUEBLA)",
  },
  {
    Fecha: "29/09/2026",
    Almacen: "COCINA PRINCIPAL",
    Cantidad: 1,
    Producto: "BLUE BERRY",
    "Numero pedido": "387531",
    "Referencia pedido":
      "FYV C.PRINCIPAL PARA ENTREGA 29/09/2026 (AGUACATES PUEBLA)",
  },
];

describe("groupOrigenCorreoToOrdenesTrabajo", () => {
  it("agrupa por Numero pedido aunque el Almacen sea igual", () => {
    const hijas = groupOrigenCorreoToOrdenesTrabajo(sampleMarina);
    expect(hijas).toHaveLength(3);
    expect(hijas.map((h) => h.numeroPedido).sort()).toEqual([
      "387529",
      "387531",
      "387537",
    ]);
    const banquetes = hijas.find((h) => h.numeroPedido === "387529");
    expect(banquetes?.renglones).toHaveLength(2);
    expect(banquetes?.label).toContain("387529");
  });

  it("mismo Numero pedido con distintos Almacen → varias hijas (caso AVA)", () => {
    const rows: OrigenCorreoRenglon[] = [
      {
        "Numero pedido": "4502949779",
        Almacen: "BAWH Bar Whisky",
        Producto: "CHILE JALAPEÑO DE 6 A 8 CM",
        Cantidad: 3,
      },
      {
        "Numero pedido": "4502949779",
        Almacen: "COPM Coc Plaza Mx",
        Producto: "CHILE JALAPEÑO DE 6 A 8 CM",
        Cantidad: 1,
      },
      {
        "Numero pedido": "4502949779",
        Almacen: "BAWH Bar Whisky",
        Producto: "FRESA DE 4 CM",
        Cantidad: 2,
      },
      {
        "Numero pedido": "4502949790",
        Almacen: "AC01 Almacen Gener",
        Producto: "LIMON PERSA",
        Cantidad: 50,
      },
    ];
    const hijas = groupOrigenCorreoToOrdenesTrabajo(rows);
    expect(hijas).toHaveLength(3);
    const bar = hijas.find((h) => h.almacen.includes("Bar Whisky"));
    const plaza = hijas.find((h) => h.almacen.includes("Plaza Mx"));
    const gener = hijas.find((h) => h.almacen.includes("Almacen Gener"));
    expect(bar?.renglones).toHaveLength(2);
    expect(plaza?.renglones).toHaveLength(1);
    expect(gener?.renglones).toHaveLength(1);
    expect(bar?.label).toContain("4502949779");
    expect(bar?.label).toMatch(/Bar Whisky/i);
  });

  it("si no hay Numero pedido, agrupa por Almacen", () => {
    const rows: OrigenCorreoRenglon[] = [
      { Almacen: "COCINA", Producto: "A", Cantidad: 1 },
      { Almacen: "COCINA", Producto: "B", Cantidad: 2 },
      { Almacen: "SALA", Producto: "C", Cantidad: 3 },
    ];
    const hijas = groupOrigenCorreoToOrdenesTrabajo(rows);
    expect(hijas).toHaveLength(2);
  });

  it("sin claves de grupo → una sola hija default", () => {
    const hijas = groupOrigenCorreoToOrdenesTrabajo([
      { Producto: "A", Cantidad: 1 },
      { Producto: "B", Cantidad: 2 },
    ]);
    expect(hijas).toHaveLength(1);
    expect(hijas[0]?.id).toBe("default");
  });
});
