import { describe, expect, it } from "vitest";
import { normalizeForMatch } from "./normalize-for-match";

describe("normalizeForMatch", () => {
  it.each([
    ["Ajó  en BOTE ", "ajo en bote"],
    ["Ñame", "name"],
    ["MANZANA-VERDE", "manzana verde"],
    ["Crème brûlée", "creme brulee"],
    ["", ""],
  ])("normaliza %j a %j", (entrada, esperado) => {
    expect(normalizeForMatch(entrada)).toBe(esperado);
  });
});
