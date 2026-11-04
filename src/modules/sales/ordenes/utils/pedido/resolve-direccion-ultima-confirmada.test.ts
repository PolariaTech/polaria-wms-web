import { describe, expect, it } from "vitest";
import { resolveDireccionDesdeUltimaConfirmada } from "./resolve-direccion-ultima-confirmada";

describe("resolveDireccionDesdeUltimaConfirmada (REQ-252)", () => {
  it("usa la última dirección confirmada si existe", () => {
    expect(
      resolveDireccionDesdeUltimaConfirmada({
        ultimaConfirmada: "Av. Confirmed 100",
        fichaDireccion: "Calle Ficha 1",
      }),
    ).toBe("Av. Confirmed 100");
  });

  it("cae a la ficha si no hay confirmada", () => {
    expect(
      resolveDireccionDesdeUltimaConfirmada({
        ultimaConfirmada: "  ",
        fichaDireccion: "Calle Ficha 1",
      }),
    ).toBe("Calle Ficha 1");
  });

  it("vacío si no hay ninguna", () => {
    expect(
      resolveDireccionDesdeUltimaConfirmada({
        ultimaConfirmada: null,
        fichaDireccion: "",
      }),
    ).toBe("");
  });
});
