import { describe, expect, it } from "vitest";
import { AMBIGUITY_GAP, MIN_SUGGESTION_SCORE } from "./producto-catalogo-match-types";

describe("producto-catalogo-match-types", () => {
  it("expone umbrales de ranking", () => {
    expect(MIN_SUGGESTION_SCORE).toBe(0.22);
    expect(AMBIGUITY_GAP).toBe(0.1);
  });
});