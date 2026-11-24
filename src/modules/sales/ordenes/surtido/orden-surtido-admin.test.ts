import { describe, expect, it } from "vitest";
import { emptyToNull } from "./orden-surtido-admin";

describe("emptyToNull", () => {
  it("devuelve null para vacío", () => {
    expect(emptyToNull("")).toBeNull();
    expect(emptyToNull("   ")).toBeNull();
    expect(emptyToNull(null)).toBeNull();
  });

  it("conserva texto no vacío", () => {
    expect(emptyToNull("hola")).toBe("hola");
    expect(emptyToNull("  x  ")).toBe("x");
  });
});