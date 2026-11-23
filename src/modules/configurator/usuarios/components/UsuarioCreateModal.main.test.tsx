import { describe, expect, it } from "vitest";
import * as barrel from "./UsuarioCreateModal";
import * as part from "./UsuarioCreateModal.main";

describe("UsuarioCreateModal.main", () => {
  it("el barrel reexporta las mismas referencias", () => {
    expect(barrel.UsuarioCreateModal).toBe(part.UsuarioCreateModal);
  });
});
