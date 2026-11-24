import { describe, expect, it } from "vitest";
import * as barrel from "./cuentas.service";
import * as part from "./cuentas.service.ov-auto-imprimir";

describe("cuentas.service.ov-auto-imprimir", () => {
  it("el barrel reexporta las mismas referencias", () => {
    expect(barrel.getCuentaOvAutoImprimirConfigurator).toBe(part.getCuentaOvAutoImprimirConfigurator);
    expect(barrel.updateCuentaOvAutoImprimirConfigurator).toBe(part.updateCuentaOvAutoImprimirConfigurator);
  });
});
