import { describe, expect, it } from "vitest";
import type { CompradorListRow } from "@/modules/admin-panel";
import {
  compradorNombresComerciales,
  compradorSearchText,
  editDistanceAtMost,
  esMatchExactoComprador,
  normalizeMatchText,
  poolActivos,
  tokenList,
  tokensNearlyEqual,
} from "./match-comprador-from-nombre-texto";

const baseRow: CompradorListRow = {
  idComprador: "c1",
  codigo: "HTL-01",
  comprador: "Hotel Fairmont Mayakoba S.A. de C.V.",
  apodo: "Fairmont Playa",
  denominacionComercialOverride: "Mayakoba Resort",
  telefono: null,
  rfc: "",
  grupo: "",
  estaActivo: true,
};

describe("match-comprador-from-nombre-texto", () => {
  it("normaliza texto quitando acentos, signos y espacios extra", () => {
    expect(normalizeMatchText("  Hotel   Cancún, S.A. de C.V.! ")).toBe(
      "hotel cancun s a de c v",
    );
  });

  it("filtra stopwords y tokens de 1 carácter en tokenList", () => {
    expect(tokenList("Hotel de la Riviera Maya S.A. de C.V.")).toEqual([
      "riviera",
      "maya",
    ]);
  });

  it("calcula editDistanceAtMost y tokensNearlyEqual correctamente", () => {
    expect(editDistanceAtMost("fairmont", "fairmnt", 1)).toBe(true);
    expect(editDistanceAtMost("fairmont", "faimnt", 1)).toBe(false);
    expect(tokensNearlyEqual("xcaret", "xcare")).toBe(true);
    expect(tokensNearlyEqual("ava", "ave")).toBe(false);
  });

  it("extrae nombres comerciales y texto de búsqueda del comprador", () => {
    expect(compradorNombresComerciales(baseRow)).toEqual([
      "Fairmont Playa",
      "Mayakoba Resort",
    ]);
    expect(compradorSearchText(baseRow)).toContain("Fairmont Playa");
    expect(compradorSearchText(baseRow)).toContain("HTL-01");
  });

  it("detecta match exacto por razón social, código o nombre comercial", () => {
    expect(esMatchExactoComprador("htl 01", baseRow)).toBe(true);
    expect(esMatchExactoComprador("fairmont playa", baseRow)).toBe(true);
    expect(esMatchExactoComprador("mayakoba resort", baseRow)).toBe(true);
    expect(esMatchExactoComprador("hilton cancun", baseRow)).toBe(false);
  });

  it("prefiere compradores activos en poolActivos y hace fallback si todos están inactivos", () => {
    const inactivo: CompradorListRow = {
      ...baseRow,
      idComprador: "c2",
      estaActivo: false,
    };
    expect(poolActivos([baseRow, inactivo])).toEqual([baseRow]);
    expect(poolActivos([inactivo])).toEqual([inactivo]);
  });
});
