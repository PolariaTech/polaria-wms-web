import { describe, expect, it } from "vitest";
import { INITIAL_FORM } from "./usuario-create-modal.constants";

describe("usuario-create-modal.constants", () => {
  it("inicia con accesos WMS y Mateo habilitados", () => {
    expect(INITIAL_FORM).toMatchObject({
      nombre: "",
      idRol: "",
      accesoWms: true,
      accesoMateo: true,
    });
  });
});
