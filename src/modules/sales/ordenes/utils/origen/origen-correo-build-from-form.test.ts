import { describe, expect, it } from "vitest";
import { createEmptyOrdenTrabajoHija } from "./origen-correo-ordenes-trabajo";
import { buildOrigenCorreoFromOrdenesYLineas } from "./origen-correo-build-from-form";
import { indexIdProductoVerificadoOrigen } from "./origen-correo-id-producto-verificado";

describe("buildOrigenCorreoFromOrdenesYLineas + indexIdProductoVerificadoOrigen (REQ-201)", () => {
  it("persiste y reindexa _idProducto verificado en origen", () => {
    const hija = createEmptyOrdenTrabajoHija({
      id: "manual:ot-1",
      almacen: "CANTINA",
    });
    const rows = buildOrigenCorreoFromOrdenesYLineas({
      hijas: [hija],
      lineas: [
        {
          otId: "manual:ot-1",
          idProducto: "prod-1",
          nombre: "Pepino",
          codigo: "105",
          cantidad: 2,
          unidadMedida: "KGM",
          precioUnitario: 10,
          aliasCliente: "pepino del correo",
        },
      ],
    });
    expect(rows[0]?._idProducto).toBe("prod-1");
    const index = indexIdProductoVerificadoOrigen(rows);
    expect(index.get("manual:ot-1#0")).toBe("prod-1");
  });

  it("REQ-311: con 1 OT incluye líneas nuevas sin otId junto a las que sí lo tienen", () => {
    const hija = createEmptyOrdenTrabajoHija({
      id: "manual:ot-1",
      almacen: "COCINA",
    });
    const rows = buildOrigenCorreoFromOrdenesYLineas({
      hijas: [hija],
      lineas: [
        {
          otId: "manual:ot-1",
          idProducto: "prod-manzana",
          nombre: "MANZANA",
          codigo: "1",
          cantidad: 15,
          unidadMedida: "KGM",
          precioUnitario: 65,
        },
        {
          // Alta en form sin otId (1 OT / sin pager)
          idProducto: "prod-coliflor",
          nombre: "COLIFLOR",
          codigo: "105001501",
          cantidad: 20,
          unidadMedida: "PZA",
          precioUnitario: 33,
        },
      ],
    });
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row["Codigo producto"])).toEqual([
      "1",
      "105001501",
    ]);
    expect(rows.every((row) => row._otId === "manual:ot-1")).toBe(true);
  });
});
