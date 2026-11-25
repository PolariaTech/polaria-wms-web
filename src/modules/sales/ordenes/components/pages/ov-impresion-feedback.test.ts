import { describe, expect, it } from "vitest";
import { MENSAJE_VERSION_NUEVA } from "../../print/print-correo-fallo";
import { FEEDBACK_VERSION_NUEVA } from "./ov-impresion-feedback";

describe("FEEDBACK_VERSION_NUEVA (REQ-189)", () => {
  it("pide recargar la página: es un fallo sin reintento ni líneas", () => {
    expect(FEEDBACK_VERSION_NUEVA).toEqual({
      ok: false,
      title: MENSAJE_VERSION_NUEVA,
      lines: [],
      retry: null,
      recargar: true,
    });
  });
});
