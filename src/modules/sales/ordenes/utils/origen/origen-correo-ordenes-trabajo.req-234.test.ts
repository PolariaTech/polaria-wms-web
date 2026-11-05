import { describe, expect, it } from "vitest";
import { groupOrigenCorreoToOrdenesTrabajo } from "./origen-correo-ordenes-trabajo";

describe("groupOrigenCorreoToOrdenesTrabajo (REQ-234)", () => {
  it("omite SKUs con cantidad 0 y conserva pedibles / placeholders", () => {
    const hijas = groupOrigenCorreoToOrdenesTrabajo([
      { Almacen: "COCINA", Producto: "Aguacate", Cantidad: 0 },
      { Almacen: "COCINA", Producto: "Tomate", Cantidad: 4 },
      { Almacen: "COCINA", Producto: "", Cantidad: 0 },
    ]);
    expect(hijas).toHaveLength(1);
    expect(hijas[0]?.renglones.map((r) => r.Producto)).toEqual([
      "Tomate",
      "",
    ]);
  });
});
