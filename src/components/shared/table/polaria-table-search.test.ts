import { describe, expect, it } from "vitest";
import { filterRowsBySearch } from "./polaria-table-search";

describe("filterRowsBySearch", () => {
  const rows = [
    { id: "1", codigo: "MIT00", nombre: "Mitre" },
    { id: "2", codigo: "AND10", nombre: "Andino" },
  ];

  it("devuelve todas las filas si la búsqueda está vacía", () => {
    expect(filterRowsBySearch(rows, "  ")).toEqual(rows);
  });

  it("filtra por coincidencia parcial e ignora acentos", () => {
    expect(filterRowsBySearch(rows, "andí")).toEqual([rows[1]]);
  });

  it("exige que todos los tokens coincidan", () => {
    expect(filterRowsBySearch(rows, "andino mitre")).toEqual([]);
    expect(filterRowsBySearch(rows, "and 10")).toEqual([rows[1]]);
  });
});
