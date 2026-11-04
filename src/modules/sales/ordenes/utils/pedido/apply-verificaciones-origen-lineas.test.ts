import { describe, expect, it } from "vitest";
import { applyVerificacionesOrigenALineas } from "./apply-verificaciones-origen-lineas";

describe("applyVerificacionesOrigenALineas (REQ-201)", () => {
  it("restaura idProducto verificado por índice de OT", () => {
    const lineas = applyVerificacionesOrigenALineas(
      [
        {
          idProducto: "",
          nombre: "Pepino",
          codigo: "",
          idBodega: "",
          kgDisponible: 0,
          unidadMedida: "KGM",
          precioUnitario: 0,
          precioInput: "",
          otId: "ot-1",
          catalogPending: true,
        },
      ],
      [{ _otId: "ot-1", _idProducto: "prod-1", Producto: "Pepino" }],
      [
        {
          idProducto: "prod-1",
          codigo: "105",
          nombre: "Pepino",
          idBodega: "bod-1",
          kgDisponible: 10,
          unidadMedida: "KGM",
          precioUnitario: 5,
        },
      ],
    );
    expect(lineas[0]?.idProducto).toBe("prod-1");
    expect(lineas[0]?.catalogPending).toBe(false);
  });
});
