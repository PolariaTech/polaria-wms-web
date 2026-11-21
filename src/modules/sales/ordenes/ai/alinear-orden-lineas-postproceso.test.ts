import { describe, expect, it } from "vitest";
import { alinearOrdenLineasConDocumento } from "./alinear-orden-lineas-postproceso";

describe("alinearOrdenLineasConDocumento (REQ-370)", () => {
  it("reordena según el texto del PDF cuando Mateo las emite al revés", () => {
    const fuente = [
      "Orden de compra Hard Rock",
      "1 LECHUGA OREJONA 3 KG",
      "2 TOMATE SALADETTE 10 KG",
      "3 AGUACATE HASS 5 KG",
      "Total pedido MXN 100",
    ].join("\n");

    const desordenadas = [
      { textoOriginal: "AGUACATE HASS", codigoProductoCliente: null },
      { textoOriginal: "LECHUGA OREJONA", codigoProductoCliente: null },
      { textoOriginal: "TOMATE SALADETTE", codigoProductoCliente: null },
    ];

    const ordenadas = alinearOrdenLineasConDocumento(desordenadas, fuente);
    expect(ordenadas.map((l) => l.textoOriginal)).toEqual([
      "LECHUGA OREJONA",
      "TOMATE SALADETTE",
      "AGUACATE HASS",
    ]);
  });

  it("prioriza filas de cuerpoMensaje tipo=tabla sobre el orden del modelo", () => {
    const filas = [
      ["Producto", "Cantidad"],
      ["PEPINO", "2"],
      ["CEBOLLA BLANCA", "4"],
      ["JITOMATE", "6"],
    ];
    const desordenadas = [
      { textoOriginal: "JITOMATE", codigoProductoCliente: null },
      { textoOriginal: "PEPINO", codigoProductoCliente: null },
      { textoOriginal: "CEBOLLA BLANCA", codigoProductoCliente: null },
    ];

    const ordenadas = alinearOrdenLineasConDocumento(
      desordenadas,
      "texto corto sin anclas",
      filas,
    );
    expect(ordenadas.map((l) => l.textoOriginal)).toEqual([
      "PEPINO",
      "CEBOLLA BLANCA",
      "JITOMATE",
    ]);
  });

  it("no toca el orden si no hay anclas fiables en la fuente", () => {
    const lineas = [
      { textoOriginal: "PRODUCTO A", codigoProductoCliente: null },
      { textoOriginal: "PRODUCTO B", codigoProductoCliente: null },
    ];
    const out = alinearOrdenLineasConDocumento(lineas, "sin coincidencias");
    expect(out.map((l) => l.textoOriginal)).toEqual(["PRODUCTO A", "PRODUCTO B"]);
  });

  it("conserva el orden si ya coincide con el documento", () => {
    const fuente = "AAA uno\nBBB dos\nCCC tres";
    const lineas = [
      { textoOriginal: "AAA", codigoProductoCliente: null },
      { textoOriginal: "BBB", codigoProductoCliente: null },
      { textoOriginal: "CCC", codigoProductoCliente: null },
    ];
    const out = alinearOrdenLineasConDocumento(lineas, fuente);
    expect(out.map((l) => l.textoOriginal)).toEqual(["AAA", "BBB", "CCC"]);
  });

  it("ancla por palabras clave si el PDF trunca el nombre largo", () => {
    const fuente = [
      "Pedido",
      "CHILE JALAPENO 6-8 12 KG",
      "CEBOLLA BLANCA 20 KG",
      "Total",
    ].join("\n");
    const desordenadas = [
      { textoOriginal: "CEBOLLA BLANCA GRANDE", codigoProductoCliente: null },
      {
        textoOriginal: "CHILE JALAPENO 6-8 CM FRESCO",
        codigoProductoCliente: null,
      },
    ];
    const out = alinearOrdenLineasConDocumento(desordenadas, fuente);
    expect(out.map((l) => l.textoOriginal)).toEqual([
      "CHILE JALAPENO 6-8 CM FRESCO",
      "CEBOLLA BLANCA GRANDE",
    ]);
  });
});
