import { describe, expect, it } from "vitest";
import { SYNONYM_INDEX } from "./producto-catalogo-synonyms";

describe("producto-catalogo-synonyms", () => {
  it("enlaza blue berry con arándanos", () => {
    const group = SYNONYM_INDEX.get("blueberry");
    expect(group?.has("arandano")).toBe(true);
    expect(group?.has("arandanos")).toBe(true);
  });
});