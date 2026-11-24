import { describe, expect, it } from "vitest";
import * as barrel from "./cuentas.service";
import * as part from "./cuentas.service.assign";

describe("cuentas.service.assign", () => {
  it("el barrel reexporta las mismas referencias", () => {
    expect(barrel.createCuentaConfigurator).toBe(part.createCuentaConfigurator);
    expect(barrel.updateCuentaConfigurator).toBe(part.updateCuentaConfigurator);
  });
});
