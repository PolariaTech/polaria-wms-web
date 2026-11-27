import { describe, expect, it } from "vitest";
import type { LineaVentaForm } from "../types/orden-venta-create-modal.types";
import { totalConIvaDeLineas } from "./aplicar-reagrupacion-ov";
import { CAMPOS_OV_NO_REINYECTAR_AL_CAMBIAR_OT } from "./cabecera-ot-desde-hija";

function linea(cantidadInput: string, precioUnitario: number, ivaPct = 0): LineaVentaForm {
  return { cantidadInput, precioUnitario, ivaPct } as unknown as LineaVentaForm;
}

/** REQ-425: el total que se compara con el del documento es el de todas las OT, con IVA. */
describe("totalConIvaDeLineas (REQ-425)", () => {
  it("suma cantidad por precio de todas las líneas", () => {
    expect(totalConIvaDeLineas([linea("4", 46), linea("4", 27), linea("8,5", 24)])).toBe(496);
  });

  it("incluye el IVA y redondea a centavos", () => {
    expect(totalConIvaDeLineas([linea("3", 10.333, 16)])).toBe(35.96);
  });

  it("sin líneas es cero y la cantidad vacía no suma", () => {
    expect(totalConIvaDeLineas([])).toBe(0);
    expect(totalConIvaDeLineas([linea("", 50)])).toBe(0);
  });
});

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
