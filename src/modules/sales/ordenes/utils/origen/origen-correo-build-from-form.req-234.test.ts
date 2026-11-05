import { describe, expect, it } from "vitest";
import { createEmptyOrdenTrabajoHija } from "./origen-correo-ordenes-trabajo";
import { buildOrigenCorreoFromOrdenesYLineas } from "./origen-correo-build-from-form";

describe("buildOrigenCorreoFromOrdenesYLineas (REQ-234)", () => {
  it("no persiste líneas con cantidad <= 0", () => {
    const hija = createEmptyOrdenTrabajoHija({
      id: "manual:ot-2",
      almacen: "COCINA",
    });
    const rows = buildOrigenCorreoFromOrdenesYLineas({
      hijas: [hija],
      lineas: [
        {
          otId: "manual:ot-2",
          nombre: "Aguacate",
          codigo: "100",
          cantidad: 0,
          unidadMedida: "KGM",
          precioUnitario: 10,
        },
        {
          otId: "manual:ot-2",
          nombre: "Tomate",
          codigo: "200",
          cantidad: 3,
          unidadMedida: "KGM",
          precioUnitario: 12,
        },
      ],
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.Producto).toBe("Tomate");
  });
});
