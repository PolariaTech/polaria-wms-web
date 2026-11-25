import { describe, expect, it } from "vitest";
import { compareOverride } from "./map-pedido-extraido-compare-override";

describe("map-pedido-extraido-compare-override", () => {
  it("compareOverride marca autoFields cuando ficha vacía", () => {
    const patch: Record<string, string> = { contacto: "" };
    const autoFields = new Set<string>();
    const warnFields = new Set<string>();
    compareOverride({
      fieldKey: "contacto",
      valorDb: "",
      valorIa: "Juan",
      patch,
      autoFields,
      warnFields,
    });
    expect(patch.contacto).toBe("Juan");
    expect(autoFields.has("contacto")).toBe(true);
  });
});