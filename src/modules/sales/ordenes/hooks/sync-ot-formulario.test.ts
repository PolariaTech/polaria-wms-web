import { describe, expect, it } from "vitest";
import {
  aplicarCabeceraFormARenglonActivo,
  aplicarCabeceraOvARenglonHermano,
} from "./sync-ot-cabecera-renglon";
import type { OrigenCorreoRenglon } from "../utils/origen/origen-correo-ordenes-trabajo";

/**
 * useSyncOtFormulario delega la cabecera a sync-ot-cabecera-renglon (REQ-281).
 * Aquí se valida el contrato vacío-gana que el hook aplica al sync.
 */
describe("sync-ot-formulario / contrato cabecera (REQ-281)", () => {
  const row: OrigenCorreoRenglon = {
    Producto: "X",
    Cantidad: 1,
    Unidad: "KGS",
    "Notas generales": "viejas",
    "Telefono contacto": "111",
  };

  it("el sync de OT activa acepta vacío del form", () => {
    const next = aplicarCabeceraFormARenglonActivo(row, {
      almacen: "",
      numeroPedido: "",
      fecha: "",
      responsableExterno: "",
      telefonoOt: "",
      correoOt: "",
      direccionOt: "",
      andenOt: "",
      ventanaDesdeOt: "",
      ventanaHastaOt: "",
      notasOt: "",
      prioridadOt: "",
    });
    expect(next["Notas generales"]).toBe("");
    expect(next["Telefono contacto"]).toBe("");
  });

  it("el sync a OT hermanas acepta vacío de cabecera OV", () => {
    const next = aplicarCabeceraOvARenglonHermano(row, {
      notasOt: "",
      direccionOt: "Nueva",
      telefonoOt: "",
      correoOt: "",
      responsableExterno: "Beto",
    });
    expect(next["Notas generales"]).toBe("");
    expect(next["Telefono contacto"]).toBe("");
    expect(next["Direccion entrega"]).toBe("Nueva");
    expect(next["Responsable externo"]).toBe("Beto");
  });
});
