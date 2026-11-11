import { describe, expect, it } from "vitest";
import { completarAlmacenDelPedido } from "./completar-almacen-del-pedido";
import { groupOrigenCorreoToOrdenesTrabajo } from "./origen-correo-ordenes-trabajo";

describe("completarAlmacenDelPedido (REQ-291)", () => {
  it("une al almacén del pedido las filas que lo traen vacío (caso OV-1364 y OV-1496)", () => {
    const filas = [
      { "Numero pedido": "MYK-0304254", Almacen: "COM cocina IRD", Producto: "Papaya" },
      { "Numero pedido": "MYK-0304254", Almacen: "", Producto: "Piña" },
      { "Numero pedido": "MYK-0304254", Producto: "Tomate verde" },
    ];
    const completas = completarAlmacenDelPedido(filas);
    expect(completas.map((fila) => fila.Almacen)).toEqual([
      "COM cocina IRD",
      "COM cocina IRD",
      "COM cocina IRD",
    ]);
  });

  it("deja una sola OT al agrupar un pedido con almacén solo en la primera fila", () => {
    const hijas = groupOrigenCorreoToOrdenesTrabajo([
      { "Numero pedido": "MYK-0304509", Almacen: "COM 01-Banquetes-", Producto: "Ajo", Cantidad: 1 },
      { "Numero pedido": "MYK-0304509", Almacen: "", Producto: "Jugo de naranja", Cantidad: 5 },
      { "Numero pedido": "MYK-0304509", Almacen: "", Producto: "Piña", Cantidad: 30 },
    ]);
    expect(hijas).toHaveLength(1);
    expect(hijas[0]?.renglones).toHaveLength(3);
  });

  it("no inventa almacén si el pedido nombra más de uno", () => {
    const filas = [
      { "Numero pedido": "P-1", Almacen: "Cocina", Producto: "Papaya" },
      { "Numero pedido": "P-1", Almacen: "Bar", Producto: "Limón" },
      { "Numero pedido": "P-1", Almacen: "", Producto: "Piña" },
    ];
    expect(completarAlmacenDelPedido(filas)[2]?.Almacen).toBe("");
  });

  it("trata «Producción» y «produccion» como el mismo almacén", () => {
    const filas = [
      { "Numero pedido": "P-1", Almacen: "Producción", Producto: "Papaya" },
      { "Numero pedido": "P-1", Almacen: "produccion", Producto: "Limón" },
      { "Numero pedido": "P-1", Almacen: "", Producto: "Piña" },
    ];
    expect(completarAlmacenDelPedido(filas)[2]?.Almacen).toBe("Producción");
  });

  it("no mezcla pedidos distintos ni toca filas sin pedido", () => {
    const filas = [
      { "Numero pedido": "P-1", Almacen: "Cocina", Producto: "Papaya" },
      { "Numero pedido": "P-2", Almacen: "", Producto: "Limón" },
      { Almacen: "", Producto: "Piña" },
    ];
    const completas = completarAlmacenDelPedido(filas);
    expect(completas[1]?.Almacen).toBe("");
    expect(completas[2]?.Almacen).toBe("");
  });

  it("respeta las filas con id de OT guardado", () => {
    const filas = [
      { "Numero pedido": "P-1", Almacen: "Cocina", Producto: "Papaya" },
      { "Numero pedido": "P-1", Almacen: "", _otId: "manual:abc", Producto: "Limón" },
    ];
    expect(completarAlmacenDelPedido(filas)[1]?.Almacen).toBe("");
  });

  it("no cambia las filas de entrada", () => {
    const filas = [
      { "Numero pedido": "P-1", Almacen: "Cocina", Producto: "Papaya" },
      { "Numero pedido": "P-1", Almacen: "", Producto: "Limón" },
    ];
    completarAlmacenDelPedido(filas);
    expect(filas[1]?.Almacen).toBe("");
  });
});
