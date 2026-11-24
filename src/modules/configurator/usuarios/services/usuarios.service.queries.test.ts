import { describe, expect, it } from "vitest";
import * as barrel from "./usuarios.service";
import * as part from "./usuarios.service.queries";

describe("usuarios.service.queries", () => {
  it("el barrel reexporta las mismas referencias", () => {
    expect(barrel.listUsuariosConfigurator).toBe(part.listUsuariosConfigurator);
    expect(barrel.listRolesConfigurator).toBe(part.listRolesConfigurator);
    expect(barrel.listCuentasAssignOptions).toBe(part.listCuentasAssignOptions);
    expect(barrel.listBodegasAssignOptions).toBe(part.listBodegasAssignOptions);
  });
});
