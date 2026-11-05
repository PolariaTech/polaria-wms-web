import { describe, expect, it } from "vitest";
import { resolveRfcClienteCatalogo } from "./rfc-cliente-ov";

describe("resolveRfcClienteCatalogo (REQ-259)", () => {
  it("prioriza el RFC de la ficha admin", () => {
    expect(
      resolveRfcClienteCatalogo({
        fichaRfc: " XAXX010101000 ",
        catalogoRfc: "OTRO",
      }),
    ).toBe("XAXX010101000");
  });

  it("cae al RFC del catálogo si la ficha no lo trae", () => {
    expect(
      resolveRfcClienteCatalogo({
        fichaRfc: "",
        catalogoRfc: "ABC010101ABC",
      }),
    ).toBe("ABC010101ABC");
  });

  it("vacío si no hay RFC", () => {
    expect(resolveRfcClienteCatalogo({ fichaRfc: null, catalogoRfc: null })).toBe(
      "",
    );
  });
});
