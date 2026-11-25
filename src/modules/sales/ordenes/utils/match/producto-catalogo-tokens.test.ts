import { describe, expect, it } from "vitest";
import { tokensNearlyEqual } from "./producto-catalogo-tokens";

describe("producto-catalogo-tokens", () => {
  it("tokensNearlyEqual detecta typo de una letra", () => {
    expect(tokensNearlyEqual("hass", "jass")).toBe(true);
    expect(tokensNearlyEqual("200", "260")).toBe(false);
  });
});