import { describe, expect, it } from "vitest";
import { buildGeneralesRows } from "./cypher-cliente-vs-mateo-build-rows";

describe("buildGeneralesRows", () => {
  it("devuelve filas de cliente, OCC y fecha", () => {
    const rows = buildGeneralesRows(
      {
        estado: "por_confirmar",
        origen_correo: null,
        origen_texto: "",
        notas_almacen: "",
        orden_compra_hotel: "",
        fecha_entrega: "",
      } as never,
      false,
      { productos: [], compradores: [] },
    );
    expect(rows.map((r) => r.campo)).toEqual([
      "Cliente",
      "OCC",
      "Fecha de entrega",
    ]);
  });
});