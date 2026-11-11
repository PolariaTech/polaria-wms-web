import { describe, expect, it } from "vitest";
import { groupOrigenCorreoToOrdenesTrabajo } from "./origen-correo-ordenes-trabajo";
import {
  contiguousOtIdsForRenglones,
  baseGroupKeyOrigenCorreo,
} from "./origen-correo-ot-contigua";

describe("origen-correo-ot-contigua (REQ-238)", () => {
  it("misma cocina que reaparece tras otra = 3 OT (sandía / papa / papaya)", () => {
    const rows = [
      {
        "Numero pedido": "PO-1",
        Almacen: "Cocina 1",
        Producto: "Sandía",
        Cantidad: 5,
      },
      {
        "Numero pedido": "PO-1",
        Almacen: "Cocina 2",
        Producto: "Papa",
        Cantidad: 5,
      },
      {
        "Numero pedido": "PO-1",
        Almacen: "Cocina 1",
        Producto: "Papaya",
        Cantidad: 5,
      },
    ];
    const hijas = groupOrigenCorreoToOrdenesTrabajo(rows);
    expect(hijas).toHaveLength(3);
    expect(hijas[0]?.almacen).toBe("Cocina 1");
    expect(hijas[0]?.renglones.map((r) => r.Producto)).toEqual(["Sandía"]);
    expect(hijas[1]?.almacen).toBe("Cocina 2");
    expect(hijas[1]?.renglones.map((r) => r.Producto)).toEqual(["Papa"]);
    expect(hijas[2]?.almacen).toBe("Cocina 1");
    expect(hijas[2]?.renglones.map((r) => r.Producto)).toEqual(["Papaya"]);
  });

  it("bloque contiguo de la misma cocina se mantiene junto", () => {
    const ids = contiguousOtIdsForRenglones([
      { Almacen: "Cocina 1", Producto: "A", Cantidad: 1 },
      { Almacen: "Cocina 1", Producto: "B", Cantidad: 1 },
      { Almacen: "Cocina 2", Producto: "C", Cantidad: 1 },
    ]);
    expect(ids[0]).toBe(ids[1]);
    expect(ids[0]).not.toBe(ids[2]);
  });

  it("Xcaret: mismo nombre + distinto Numero almacen = OT distintas", () => {
    const a = baseGroupKeyOrigenCorreo({
      "Numero pedido": "4501056534",
      Almacen: "Ayb Xp Restaurant Troglodita",
      "Numero almacen": "3672237",
    });
    const b = baseGroupKeyOrigenCorreo({
      "Numero pedido": "4501056534",
      Almacen: "Ayb Xp Restaurant Troglodita",
      "Numero almacen": "3672216",
    });
    expect(a).not.toBe(b);
  });
});
