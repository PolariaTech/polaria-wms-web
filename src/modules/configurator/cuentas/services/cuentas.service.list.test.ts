import { describe, expect, it } from "vitest";
import * as barrel from "./cuentas.service";
import * as part from "./cuentas.service.list";

describe("cuentas.service.list", () => {
  it("el barrel reexporta las mismas referencias", () => {
    expect(barrel.listCuentasConfigurator).toBe(part.listCuentasConfigurator);
    expect(barrel.listCuentasGobiernoConfigurator).toBe(part.listCuentasGobiernoConfigurator);
    expect(barrel.getCuentaGobiernoConfigurator).toBe(part.getCuentaGobiernoConfigurator);
    expect(barrel.listEmpresasAssignOptions).toBe(part.listEmpresasAssignOptions);
  });
});
