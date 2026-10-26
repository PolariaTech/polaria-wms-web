import { describe, expect, it } from "vitest";
import type { OrdenTrabajoHija } from "./origen-correo-ordenes-trabajo";
import { withNotasGeneralesOnHijas } from "./notas-generales-ot";

const baseHijas = (): OrdenTrabajoHija[] => [
  {
    id: "ot-a",
    label: "A",
    numeroPedido: "1",
    almacen: "AVA",
    referenciaPedido: "",
    fecha: "",
    responsableExterno: "",
    totalCantidad: 1,
    renglones: [
      { Producto: "Fresa", Cantidad: 1, "Notas generales": "nota vieja A" },
    ],
  },
  {
    id: "ot-b",
    label: "B",
    numeroPedido: "2",
    almacen: "MAR",
    referenciaPedido: "",
    fecha: "",
    responsableExterno: "",
    totalCantidad: 1,
    renglones: [
      { Producto: "Mango", Cantidad: 1, "Notas generales": "nota vieja B" },
    ],
  },
];

describe("withNotasGeneralesOnHijas (REQ-141)", () => {
  it("notas vacías limpian todas las OT del origen", () => {
    const next = withNotasGeneralesOnHijas(baseHijas(), "");
    expect(next[0]?.renglones[0]?.["Notas generales"]).toBe("");
    expect(next[1]?.renglones[0]?.["Notas generales"]).toBe("");
  });

  it("propaga el texto canónico de la OV a todas las OT", () => {
    const next = withNotasGeneralesOnHijas(baseHijas(), "  solo almacén  ");
    expect(next[0]?.renglones[0]?.["Notas generales"]).toBe("solo almacén");
    expect(next[1]?.renglones[0]?.["Notas generales"]).toBe("solo almacén");
  });
});
