import { describe, expect, it } from "vitest";
import type { OrdenTrabajoHija } from "../origen/origen-correo-ordenes-trabajo";
import { construirEstadoBaseApi } from "./construir-estado-base-reagrupacion";
import {
  PropuestaInvalidaError,
  validarPropuestaContraBase,
} from "./validar-propuesta-reagrupacion";

describe("validar-propuesta-reagrupacion", () => {
  it("rechaza OT inexistente", () => {
    const hijas: OrdenTrabajoHija[] = [
      {
        id: "ot-1",
        label: "OT 1",
        numeroPedido: "PO-1",
        almacen: "COCINA",
        referenciaPedido: "",
        fecha: "",
        responsableExterno: "",
        renglones: [{ Producto: "LIMON", Cantidad: 1, Unidad: "KGS", "Codigo producto": "L", "Notas generales": "", "Telefono contacto": "" }],
        totalCantidad: 1,
      },
    ];
    const { indice } = construirEstadoBaseApi(hijas, [], Number);
    expect(() =>
      validarPropuestaContraBase(
        { ots: [{ otId: "ot-fantasma", nuevaClave: null, etiquetaSugerida: null, renglonIds: ["renglon-0-0"] }] },
        hijas,
        indice,
      ),
    ).toThrow(PropuestaInvalidaError);
  });
});