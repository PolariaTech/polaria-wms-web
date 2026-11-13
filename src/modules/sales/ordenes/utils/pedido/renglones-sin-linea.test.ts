import { describe, expect, it } from "vitest";
import type { OrigenCorreoRenglon } from "../origen/origen-correo-ordenes-trabajo";
import { indicesRenglonesSinLinea, type LineaParaEmparejar } from "./renglones-sin-linea";

const linea = (nombre: string, cantidadInput: string, extra: Partial<LineaParaEmparejar> = {}): LineaParaEmparejar => ({
  idProducto: `id-${nombre}`,
  nombre,
  codigo: "",
  cantidadInput,
  ...extra,
});

const RENGLONES: OrigenCorreoRenglon[] = [
  { Producto: "Jugo de Limón fresco galón de 5 litros", Cantidad: 1 },
  { Producto: "Pimiento morrón ROJO por kilo", Cantidad: 5 },
  { Producto: "Jugo de Naranja fresco cubeta de 10 litros", Cantidad: 2 },
];

describe("indicesRenglonesSinLinea (REQ-309)", () => {
  it("sin líneas faltantes no hay pendientes", () => {
    const lineas = [linea("JUGO DE LIMON", "1"), linea("PIMIENTO MORRON ROJO", "5"), linea("JUGO DE NARANJA", "2")];
    expect(indicesRenglonesSinLinea(lineas, RENGLONES)).toEqual([]);
  });

  it("el pendiente es el renglón descartado, aunque no sea el último", () => {
    const lineas = [linea("JUGO DE LIMON", "1"), linea("JUGO DE NARANJA", "2")];
    expect(indicesRenglonesSinLinea(lineas, RENGLONES)).toEqual([1]);
  });

  it("el pendiente puede ser el primero", () => {
    const lineas = [linea("PIMIENTO MORRON ROJO", "5"), linea("JUGO DE NARANJA", "2")];
    expect(indicesRenglonesSinLinea(lineas, RENGLONES)).toEqual([0]);
  });

  it("un color distinto no empareja: el verde no se lleva el renglón del rojo", () => {
    const rows: OrigenCorreoRenglon[] = [
      { Producto: "CHILE MORRON ROJO", Cantidad: 3 },
      { Producto: "CHILE MORRON VERDE", Cantidad: 3 },
    ];
    expect(indicesRenglonesSinLinea([linea("CHILE MORRON VERDE", "3")], rows)).toEqual([0]);
    expect(indicesRenglonesSinLinea([linea("CHILE MORRON ROJO", "3")], rows)).toEqual([1]);
  });

  it("el producto verificado (_idProducto) manda sobre el nombre", () => {
    const rows: OrigenCorreoRenglon[] = [
      { Producto: "Tomate", Cantidad: 1, _idProducto: "id-A" },
      { Producto: "Tomate", Cantidad: 1, _idProducto: "id-B" },
    ];
    const lineas = [linea("TOMATE SALADET", "1", { idProducto: "id-B" })];
    expect(indicesRenglonesSinLinea(lineas, rows)).toEqual([0]);
  });

  it("control: si los nombres no se parecen, empareja por posición como antes", () => {
    const rows: OrigenCorreoRenglon[] = [
      { Producto: "Manzana Starking", Cantidad: 4 },
      { Producto: "Pera", Cantidad: 2 },
    ];
    expect(indicesRenglonesSinLinea([linea("MANZANA GRANNY SMITH", "4")], rows)).toEqual([1]);
    expect(indicesRenglonesSinLinea([linea("OTRA COSA", "9")], rows)).toEqual([1]);
  });

  it("control: nunca devuelve más pendientes que renglones - líneas", () => {
    const lineas = [linea("X1", "1"), linea("X2", "1")];
    expect(indicesRenglonesSinLinea(lineas, RENGLONES)).toHaveLength(1);
    expect(indicesRenglonesSinLinea([], RENGLONES)).toEqual([0, 1, 2]);
  });
});
