import { describe, expect, it } from "vitest";
import { POLARIA_BRAND, POLARIA_PRODUCT_VERSION } from "./brand";

describe("brand", () => {
  it("expone marca y SemVer de producto", () => {
    expect(POLARIA_BRAND).toBe("polaria.tech");
    expect(POLARIA_PRODUCT_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
