import { describe, expect, it } from "vitest";
import { ovTieneLineasMaterializadas } from "./map-detalle-lineas-a-form";

describe("ovTieneLineasMaterializadas (REQ-195)", () => {
  it("true solo si hay id_producto", () => {
    expect(ovTieneLineasMaterializadas([])).toBe(false);
    expect(ovTieneLineasMaterializadas([{ id_producto: "" }])).toBe(false);
    expect(
      ovTieneLineasMaterializadas([{ id_producto: "prod-1" }]),
    ).toBe(true);
  });
});
