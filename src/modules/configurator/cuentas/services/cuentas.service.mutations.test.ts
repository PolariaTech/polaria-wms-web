import { describe, expect, it } from "vitest";
import * as barrel from "./cuentas.service";
import * as part from "./cuentas.service.mutations";

describe("cuentas.service.mutations", () => {
  it("el barrel reexporta las mismas referencias", () => {
    expect(barrel.updateCuentaBodegaDefaultConfigurator).toBe(part.updateCuentaBodegaDefaultConfigurator);
  });
});
