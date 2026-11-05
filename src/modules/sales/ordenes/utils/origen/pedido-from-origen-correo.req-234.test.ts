import { describe, expect, it } from "vitest";
import { buildPedidoExtraidoFromOrigenCorreo } from "./pedido-from-origen-correo";

describe("buildPedidoExtraidoFromOrigenCorreo (REQ-234)", () => {
  it("omite SKUs con cantidad <= 0 al armar el pedido", () => {
    const pedido = buildPedidoExtraidoFromOrigenCorreo({
      origenCorreo: [
        { Producto: "Aguacate", Cantidad: 0, Almacen: "COCINA" },
        { Producto: "Tomate", Cantidad: 3, Almacen: "COCINA" },
        { Producto: "", Cantidad: 0, Almacen: "COCINA" },
      ],
    });

    expect(pedido.lineas.map((l) => l.textoOriginal)).toEqual(["Tomate", ""]);
    expect(pedido.origenCorreo).toHaveLength(2);
  });
});
