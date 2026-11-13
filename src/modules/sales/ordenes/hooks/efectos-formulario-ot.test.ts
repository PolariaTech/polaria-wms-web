import { describe, expect, it } from "vitest";
import {
  CAMPOS_OV_NO_REINYECTAR_AL_CAMBIAR_OT,
  cabeceraOtDesdeHija,
} from "./cabecera-ot-desde-hija";
import type { OrdenTrabajoHija } from "../utils/origen/origen-correo-ordenes-trabajo";

/** Contrato del efecto de cambio de OT en useEfectosFormularioOt (REQ-281). */
describe("efectos-formulario-ot / cabecera al cambiar OT", () => {
  it("la cabecera inyectable no incluye campos de OV", () => {
    const hija: OrdenTrabajoHija = {
      id: "ot-2",
      label: "OC-2",
      numeroPedido: "OC-2",
      almacen: "COCINA B",
      referenciaPedido: "",
      fecha: "2026-05-01",
      responsableExterno: "Luis",
      renglones: [
        {
          Producto: "LIMON",
          Cantidad: 2,
          Unidad: "KGS",
          "Telefono contacto": "999",
          "Correo contacto": "x@y.z",
          "Notas generales": "vieja",
        },
      ],
      totalCantidad: 2,
    };
    const keys = Object.keys(cabeceraOtDesdeHija(hija));
    for (const campo of CAMPOS_OV_NO_REINYECTAR_AL_CAMBIAR_OT) {
      expect(keys).not.toContain(campo);
    }
  });
});
