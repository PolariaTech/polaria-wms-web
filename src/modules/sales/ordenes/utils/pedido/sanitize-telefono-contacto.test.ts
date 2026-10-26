import { describe, expect, it } from "vitest";
import {
  sanitizeTelefonoContacto,
  sanitizeTelefonoContactoOrNull,
} from "./sanitize-telefono-contacto";

describe("sanitizeTelefonoContacto", () => {
  it("convierte %20 en espacios", () => {
    expect(sanitizeTelefonoContacto("(998)%20188%207937")).toBe(
      "(998) 188 7937",
    );
  });

  it("decodifica tel: con espacios encoded", () => {
    expect(
      sanitizeTelefonoContacto("tel:+52%20998%20188%207937"),
    ).toBe("+52 998 188 7937");
  });

  it("deja un número normal intacto", () => {
    expect(sanitizeTelefonoContacto("(998) 1887937 / Ext. 782")).toBe(
      "(998) 1887937 / Ext. 782",
    );
  });

  it("devuelve vacío / null cuando no hay valor", () => {
    expect(sanitizeTelefonoContacto("  ")).toBe("");
    expect(sanitizeTelefonoContactoOrNull(null)).toBeNull();
  });
});
