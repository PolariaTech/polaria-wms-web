import { describe, expect, it } from "vitest";
import * as barrel from "./impresoras.service";
import * as part from "./impresoras.service.queries";

describe("impresoras.service.queries", () => {
  it("el barrel reexporta las mismas referencias", () => {
    expect(barrel.getImpresoraActivaCuenta).toBe(part.getImpresoraActivaCuenta);
    expect(barrel.listImpresorasConfigurator).toBe(part.listImpresorasConfigurator);
    expect(barrel.resolveUsuarioNombres).toBe(part.resolveUsuarioNombres);
    expect(barrel.assertCuentaSinImpresoraActiva).toBe(part.assertCuentaSinImpresoraActiva);
  });
});
