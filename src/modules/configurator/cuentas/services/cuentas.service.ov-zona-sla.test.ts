import { describe, expect, it } from "vitest";
import * as barrel from "./cuentas.service";
import * as part from "./cuentas.service.ov-zona-sla";

describe("cuentas.service.ov-zona-sla", () => {
  it("el barrel reexporta las mismas referencias", () => {
    expect(barrel.getCuentaZonaHorariaConfigurator).toBe(part.getCuentaZonaHorariaConfigurator);
    expect(barrel.updateCuentaZonaHorariaConfigurator).toBe(part.updateCuentaZonaHorariaConfigurator);
    expect(barrel.getCuentaOvSlaConfigurator).toBe(part.getCuentaOvSlaConfigurator);
    expect(barrel.updateCuentaOvSlaConfigurator).toBe(part.updateCuentaOvSlaConfigurator);
  });
});
