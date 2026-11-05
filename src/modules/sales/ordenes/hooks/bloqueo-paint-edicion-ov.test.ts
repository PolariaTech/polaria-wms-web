import { describe, expect, it } from "vitest";
import { debeBloquearPaintEdicion } from "./bloqueo-paint-edicion-ov";

describe("debeBloquearPaintEdicion (REQ-170)", () => {
  it("bloquea solo al abrir en edición", () => {
    expect(debeBloquearPaintEdicion({ open: true, isEditing: true })).toBe(
      true,
    );
    expect(debeBloquearPaintEdicion({ open: true, isEditing: false })).toBe(
      false,
    );
    expect(debeBloquearPaintEdicion({ open: false, isEditing: true })).toBe(
      false,
    );
  });
});
