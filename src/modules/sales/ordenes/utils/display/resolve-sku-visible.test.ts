import { describe, expect, it } from "vitest";
import { resolveSkuVisible, resolveTextoProductoOrigen } from "./resolve-sku-visible";
import type { OrdenTrabajoHija } from "../origen/origen-correo-ordenes-trabajo";

describe("resolveSkuVisible", () => {
  it("usa el código del origen cuando el sku está archivado", () => {
    const hija: OrdenTrabajoHija = {
      id: "ot-jalisco",
      label: "Jalisco",
      numeroPedido: "450",
      almacen: "Ayb Xc Restaurant Jalisco",
      referenciaPedido: "",
      fecha: "",
      responsableExterno: "",
      totalCantidad: 0.25,
      renglones: [
        {
          Producto: "BLUE BERRY",
          "Codigo producto": "X200062800",
          Cantidad: 0.25,
          Almacen: "Ayb Xc Restaurant Jalisco",
        },
      ],
    };

    const sku = resolveSkuVisible({
      linea: {
        id_linea_orden_venta: "l1",
        id_producto: "p1",
        cantidad_pedida: 0.25,
        precio_unitario: 330,
        producto: {
          sku: "ARCH-b61ee2fa39bb4634b63a3a1b279721b0",
          descripcion: "BLUE BERRY",
          metadatos_catalogo: null,
        },
      },
      hija,
    });

    expect(sku).toBe("X200062800");
  });

  it("respeta un sku usable del catálogo", () => {
    expect(
      resolveSkuVisible({
        linea: {
          id_linea_orden_venta: "l1",
          id_producto: "p1",
          cantidad_pedida: 1,
          precio_unitario: 10,
          producto: {
            sku: "X200062800",
            descripcion: "BLUE BERRY",
            metadatos_catalogo: null,
          },
        },
      }),
    ).toBe("X200062800");
  });
});

describe("resolveTextoProductoOrigen (REQ-309: Solicitado de otro renglón)", () => {
  const renglones = [
    { Producto: "CHILE MORRON ROJO", "Codigo producto": "10501521", Cantidad: 3 },
    { Producto: "CHILE MORRON VERDE", "Codigo producto": "10501520", Cantidad: 3 },
  ];
  const linea = (descripcion: string, cantidad: number) => ({
    id_linea_orden_venta: "l1",
    id_producto: "p1",
    cantidad_pedida: cantidad,
    precio_unitario: 65,
    producto: { sku: "10501520", descripcion, metadatos_catalogo: null },
  });

  it("el renglón verde muestra su texto y no el del rojo con la misma cantidad (OV-1445)", () => {
    expect(
      resolveTextoProductoOrigen({ linea: linea("CHILE MORRON VERDE", 3), origenRenglones: renglones }),
    ).toBe("CHILE MORRON VERDE");
  });

  it("el rojo sigue mostrando el rojo", () => {
    expect(
      resolveTextoProductoOrigen({ linea: linea("CHILE MORRON ROJO", 3), origenRenglones: renglones }),
    ).toBe("CHILE MORRON ROJO");
  });

  it("no toma el texto de un renglón de otro color aunque sea el único parecido", () => {
    expect(
      resolveTextoProductoOrigen({ linea: linea("CHILE MORRON VERDE", 3), origenRenglones: [renglones[0]!] }),
    ).toBe("");
  });

  it("un nombre igual gana a una cantidad igual de un nombre solo parecido", () => {
    const filas = [
      { Producto: "Pimiento morrón amarillo por kilo", Cantidad: 5 },
      { Producto: "PIMIENTO MORRON", Cantidad: 2 },
    ];
    expect(
      resolveTextoProductoOrigen({ linea: linea("PIMIENTO MORRON", 5), origenRenglones: filas }),
    ).toBe("PIMIENTO MORRON");
  });

  it("control: sin colores en conflicto empareja por nombre parecido y cantidad como antes", () => {
    const filas = [
      { Producto: "Jugo de Limón fresco galón de 5 litros", Cantidad: 1 },
      { Producto: "Jugo de Limón fresco galón de 5 litros", Cantidad: 4 },
    ];
    expect(
      resolveTextoProductoOrigen({ linea: linea("JUGO DE LIMON", 4), origenRenglones: filas }),
    ).toBe("Jugo de Limón fresco galón de 5 litros");
  });

  it("control: match_producto.textoCliente sigue mandando", () => {
    const l = { ...linea("CHILE MORRON VERDE", 3), match_producto: { textoCliente: "Chile verde (texto del cliente)" } };
    expect(
      resolveTextoProductoOrigen({ linea: l as never, origenRenglones: renglones }),
    ).toBe("Chile verde (texto del cliente)");
  });
});
