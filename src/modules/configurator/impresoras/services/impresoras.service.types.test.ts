import { describe, expect, it } from "vitest";
import * as part from "./impresoras.service.types";

describe("impresoras.service.types", () => {
  it("carga el módulo (solo tipos)", () => {
    expect(part).toBeDefined();
  });
});
