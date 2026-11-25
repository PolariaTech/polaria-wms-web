import { describe, expect, it } from "vitest";
import type { OrdenTrabajoHija } from "../origen/origen-correo-ordenes-trabajo";
import { aplicarReagrupacion } from "./aplicar-reagrupacion-ordenes";
import { construirEstadoBaseApi } from "./construir-estado-base-reagrupacion";

describe("aplicar-reagrupacion-ordenes", () => {
  it("conserva OT sin movimientos", () => {
    const hijas: OrdenTrabajoHija[] = [
      {
        id: "ot-1",
        label: "OT 1",
        numeroPedido: "PO-1",
        almacen: "COCINA",
        referenciaPedido: "",
        fecha: "",
        responsableExterno: "",
        renglones: [{ Producto: "LIMON", Cantidad: 2, Unidad: "KGS", "Codigo producto": "L", "Notas generales": "", "Telefono contacto": "" }],
        totalCantidad: 2,
      },
    ];
    const lineas = [{ nombre: "LIMON", codigo: "L", cantidadInput: "2", otId: "ot-1" }];
    const { indice } = construirEstadoBaseApi(hijas, lineas, Number);
    const r = aplicarReagrupacion({
      hijas,
      lineas,
      indice,
      propuesta: {
        ots: [{ otId: "ot-1", nuevaClave: null, etiquetaSugerida: null, renglonIds: ["renglon-0-0"] }],
      },
      generarIdOt: () => "manual:test-id",
    });
    expect(r.hijas[0]!.id).toBe("ot-1");
    expect(r.movimientos).toHaveLength(0);
  });
});