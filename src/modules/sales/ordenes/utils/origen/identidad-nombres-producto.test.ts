import { describe, expect, it } from "vitest";
import {
  afinidadDeNombres,
  coloresDeNombre,
  nombresContradicenPorColor,
  nombresIguales,
  palabrasDeNombre,
} from "./identidad-nombres-producto";

describe("identidad de nombres de producto (REQ-309)", () => {
  it("palabrasDeNombre quita acentos, plurales simples y conectores", () => {
    expect(palabrasDeNombre("Pimientos morrón ROJOS por kilo")).toEqual(["pimiento", "morron", "rojo"]);
    expect(palabrasDeNombre(null)).toEqual([]);
  });

  it("coloresDeNombre reconoce género y plural", () => {
    expect([...coloresDeNombre("CHILE MORRON VERDE")]).toEqual(["verde"]);
    expect([...coloresDeNombre("cebollas moradas y blancas")].sort()).toEqual(["blanco", "morado"]);
    expect(coloresDeNombre("Aguacate Hass").size).toBe(0);
  });

  it("verde y rojo se contradicen; sin color o con un color en común no", () => {
    expect(nombresContradicenPorColor("CHILE MORRON VERDE", "CHILE MORRON ROJO")).toBe(true);
    expect(nombresContradicenPorColor("CHILE MORRON", "CHILE MORRON ROJO")).toBe(false);
    expect(nombresContradicenPorColor("Pimiento morrón rojo", "CHILE MORRON ROJO")).toBe(false);
  });

  it("nombresIguales ignora orden, acentos y plural", () => {
    expect(nombresIguales("Jugo de Limón", "limon jugo")).toBe(true);
    expect(nombresIguales("Jugo de Limón", "Jugo de Naranja")).toBe(false);
    expect(nombresIguales("", "")).toBe(false);
  });

  it("afinidadDeNombres es -1 con color distinto y proporcional a las palabras comunes", () => {
    expect(afinidadDeNombres("CHILE MORRON VERDE", "CHILE MORRON ROJO")).toBe(-1);
    expect(afinidadDeNombres("Jugo de Limón fresco galón", "JUGO DE LIMON")).toBe(1);
    expect(afinidadDeNombres("Piña", "Aguacate")).toBe(0);
  });
});
