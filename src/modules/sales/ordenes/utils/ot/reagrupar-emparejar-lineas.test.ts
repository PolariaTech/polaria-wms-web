import { describe, expect, it } from "vitest";
import type { OrdenTrabajoHija } from "../origen/origen-correo-ordenes-trabajo";
import { emparejarLineas } from "./reagrupar-emparejar-lineas";

describe("reagrupar-emparejar-lineas", () => {
  it("empareja línea de la misma OT", () => {
    const hijas: OrdenTrabajoHija[] = [
      {
        id: "ot-1",
        label: "OT 1",
        numeroPedido: "PO-1",
        almacen: "COCINA",
        referenciaPedido: "",
        fecha: "",
        responsableExterno: "",
        renglones: [
          {
            Producto: "AGUACATE",
            Cantidad: 5,
            Unidad: "KGS",
            "Codigo producto": "COD-AGU",
            "Notas generales": "",
            "Telefono contacto": "",
          },
        ],
        totalCantidad: 5,
      },
    ];
    const map = emparejarLineas(
      hijas,
      [{ nombre: "AGUACATE", codigo: "COD-AGU", cantidadInput: "5", otId: "ot-1" }],
      Number,
    );
    expect(map.get("0:0")).toBe(0);
  });
});