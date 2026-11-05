import { describe, expect, it } from "vitest";
import { createEmptyOrdenTrabajoHija } from "./origen-correo-ordenes-trabajo";
import { buildOrigenCorreoFromOrdenesYLineas } from "./origen-correo-build-from-form";

describe("buildOrigenCorreoFromOrdenesYLineas REQ-236", () => {
  it("sella _idProducto en renglones cuando el form no trae otId de la OT", () => {
    const hija = createEmptyOrdenTrabajoHija({
      id: "ot-correo",
      almacen: "Cocina",
    });
    hija.renglones = [
      {
        Producto: "Pepino del correo",
        "Codigo producto": "105",
        Cantidad: 2,
      },
    ];
    const rows = buildOrigenCorreoFromOrdenesYLineas({
      hijas: [hija],
      lineas: [
        {
          idProducto: "prod-1",
          nombre: "Pepino",
          codigo: "105",
          cantidad: 2,
          unidadMedida: "KGM",
          precioUnitario: 10,
          aliasCliente: "Pepino del correo",
        },
      ],
    });
    expect(rows[0]?._idProducto).toBe("prod-1");
  });
});
