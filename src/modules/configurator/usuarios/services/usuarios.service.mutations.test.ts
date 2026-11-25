import { describe, expect, it } from "vitest";
import * as barrel from "./usuarios.service";
import * as part from "./usuarios.service.mutations";

describe("usuarios.service.mutations", () => {
  it("el barrel reexporta las mismas referencias", () => {
    expect(barrel.createUsuarioConfigurator).toBe(part.createUsuarioConfigurator);
    expect(barrel.updateUsuarioConfigurator).toBe(part.updateUsuarioConfigurator);
  });
});
