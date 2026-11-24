import { describe, expect, it } from "vitest";
import * as barrel from "./usuarios.service";
import * as part from "./usuarios.service.shared";

describe("usuarios.service.shared", () => {
  it("el barrel reexporta las mismas referencias", () => {
    expect(barrel.USUARIO_LIST_COLUMNS).toBe(part.USUARIO_LIST_COLUMNS);
    expect(barrel.mapUsuarioRow).toBe(part.mapUsuarioRow);
  });
});
