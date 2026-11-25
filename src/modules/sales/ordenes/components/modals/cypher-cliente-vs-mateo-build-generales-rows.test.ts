import { describe, expect, it } from "vitest";
import { buildGeneralesRows } from "./cypher-cliente-vs-mateo-build-generales-rows";
import { buildGeneralesRows as desdeRutaAntigua } from "./cypher-cliente-vs-mateo-build-rows";

const ordenVacia = {
  estado: "por_confirmar",
  origen_correo: null,
  origen_texto: "",
  notas_almacen: "",
  orden_compra_hotel: "",
  fecha_entrega: "",
} as never;

describe("buildGeneralesRows (archivo propio)", () => {
  it("devuelve cliente, OCC y fecha de entrega en ese orden", () => {
    const rows = buildGeneralesRows(ordenVacia, false, {
      productos: [],
      compradores: [],
    });

    expect(rows.map((r) => r.campo)).toEqual([
      "Cliente",
      "OCC",
      "Fecha de entrega",
    ]);
  });

  it("no muestra el valor del usuario si no lo confirmó", () => {
    const rows = buildGeneralesRows(
      { ...(ordenVacia as object), orden_compra_hotel: "OC-77" } as never,
      false,
      { productos: [], compradores: [] },
    );

    expect(rows.find((r) => r.campo === "OCC")?.usuario).toBe("");
  });

  it("la ruta antigua build-rows exporta la misma función", () => {
    expect(desdeRutaAntigua).toBe(buildGeneralesRows);
  });
});
