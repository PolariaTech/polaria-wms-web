import { describe, expect, it } from "vitest";
import type { OrdenTrabajoHija } from "../origen/origen-correo-ordenes-trabajo";
import { construirEstadoBaseApi } from "./construir-estado-base-reagrupacion";

describe("construir-estado-base-reagrupacion", () => {
  it("genera renglonId estable", () => {
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
    const { estadoBase, indice } = construirEstadoBaseApi(hijas, [], Number);
    expect(estadoBase.ots[0]!.renglones[0]!.renglonId).toBe("renglon-0-0");
    expect(indice.orden).toEqual(["renglon-0-0"]);
  });
});