import { describe, expect, it } from "vitest";
import * as barrel from "./cuentas.service";
import * as part from "./cuentas.service.shared";

describe("cuentas.service.shared", () => {
  it("el barrel reexporta las mismas referencias", () => {
    expect(barrel.CUENTA_LIST_COLUMNS).toBe(part.CUENTA_LIST_COLUMNS);
    expect(barrel.mapCuentaRow).toBe(part.mapCuentaRow);
    expect(barrel.loadCuentasConCredencialesAuth).toBe(part.loadCuentasConCredencialesAuth);
    expect(barrel.loadBodegasByCuenta).toBe(part.loadBodegasByCuenta);
    expect(barrel.withEmpresaSchema).toBe(part.withEmpresaSchema);
  });
});
