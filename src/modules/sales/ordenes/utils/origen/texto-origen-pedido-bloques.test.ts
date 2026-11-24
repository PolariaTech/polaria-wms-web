import { describe, expect, it } from "vitest";
import { parseOrigenPedidoBlocks } from "./texto-origen-pedido-bloques";
import { parseOrigenPedidoBlocks as desdeContenido } from "./texto-origen-pedido-contenido";

describe("parseOrigenPedidoBlocks", () => {
  it("separa prosa y tabla del formato [[texto]] / [[tabla]]", () => {
    const raw = [
      "[[texto]]",
      "Favor de surtir el lunes",
      "[[tabla]]",
      "SKU | Producto | Cantidad",
      "X100001 | Tomate | 12",
    ].join("\n");

    const blocks = parseOrigenPedidoBlocks(raw);

    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toEqual({ type: "text", text: "Favor de surtir el lunes" });
    expect(blocks[1]?.type).toBe("table");
    if (blocks[1]?.type === "table") {
      expect(blocks[1].rows).toHaveLength(2);
      expect(blocks[1].rows[1]).toEqual(["X100001", "Tomate", "12"]);
    }
  });

  it("rellena con celdas vacías las filas más cortas de la tabla", () => {
    const raw = ["[[tabla]]", "A | B | C", "1 | 2"].join("\n");

    const blocks = parseOrigenPedidoBlocks(raw);

    expect(blocks).toHaveLength(1);
    if (blocks[0]?.type === "table") {
      expect(blocks[0].rows[1]).toEqual(["1", "2", ""]);
    }
  });

  it("devuelve lista vacía con texto vacío", () => {
    expect(parseOrigenPedidoBlocks("   ")).toEqual([]);
  });

  it("la ruta antigua desde texto-origen-pedido-contenido sigue exportando el mismo parser", () => {
    expect(desdeContenido).toBe(parseOrigenPedidoBlocks);
  });
});
