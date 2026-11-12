import { describe, expect, it } from "vitest";
import { CAMPOS_OV_NO_REINYECTAR_AL_CAMBIAR_OT } from "./cabecera-ot-desde-hija";

/**
 * REQ-281: al cambiar de OT, useEfectosFormularioOt (reexportado aquí) usa
 * cabeceraOtDesdeHija y no reinyecta cabecera OV. Cubierto en cabecera-ot-desde-hija.test.ts.
 */
describe("aplicar-reagrupacion-ov / efectos OT (REQ-281)", () => {
  it("no reinyecta contacto, teléfono, correo, dirección ni notas al cambiar OT", () => {
    expect([...CAMPOS_OV_NO_REINYECTAR_AL_CAMBIAR_OT]).toContain("contacto");
    expect([...CAMPOS_OV_NO_REINYECTAR_AL_CAMBIAR_OT]).toContain("telefono");
    expect([...CAMPOS_OV_NO_REINYECTAR_AL_CAMBIAR_OT]).toContain("correo");
    expect([...CAMPOS_OV_NO_REINYECTAR_AL_CAMBIAR_OT]).toContain("direccion");
    expect([...CAMPOS_OV_NO_REINYECTAR_AL_CAMBIAR_OT]).toContain("notas");
  });
});
