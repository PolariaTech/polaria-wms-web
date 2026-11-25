import { describe, expect, it } from "vitest";
import { matchesProductoCatalogSearch } from "./matches-producto-catalog-search";

describe("matches-producto-catalog-search", () => {
  it("encuentra por token distintivo", () => {
    expect(
      matchesProductoCatalogSearch("lechuga romana", {
        nombre: "LECHUGA OREJONA",
        codigo: "L001",
        equivalencia: "romana",
      }),
    ).toBe(true);
  });
});