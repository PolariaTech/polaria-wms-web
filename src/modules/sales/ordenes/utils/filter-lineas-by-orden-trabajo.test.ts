import { describe, expect, it } from "vitest";
import { filterLineasByOrdenTrabajoHija } from "./filter-lineas-by-orden-trabajo";
import type { OrdenTrabajoHija } from "./origen-correo-ordenes-trabajo";

function linea(params: {
  id: string;
  nombre: string;
  sku: string;
  kg: number;
}) {
  return {
    id_linea_orden_venta: params.id,
    cantidad_pedida: params.kg,
    producto: {
      sku: params.sku,
      descripcion: params.nombre,
      metadatos_catalogo: null,
    },
  };
}

function hija(renglones: OrdenTrabajoHija["renglones"]): OrdenTrabajoHija {
  return {
    id: "pedido:450|almacen:troglodita",
    label: "450 — Troglodita",
    numeroPedido: "450",
    almacen: "Troglodita",
    referenciaPedido: "",
    fecha: "",
    responsableExterno: "",
    renglones,
    totalCantidad: renglones.reduce(
      (s, r) => s + (typeof r.Cantidad === "number" ? r.Cantidad : 0),
      0,
    ),
  };
}

describe("filterLineasByOrdenTrabajoHija", () => {
  it("no arrastra el mismo SKU de otras OTs (empareja 1:1 por cantidad)", () => {
    const all = [
      linea({ id: "a1", nombre: "FRESA FRESCA", sku: "X200012100", kg: 2 }),
      linea({ id: "a2", nombre: "ZARZAMORA", sku: "X200072100", kg: 0.75 }),
      linea({ id: "b1", nombre: "FRESA FRESCA", sku: "X200012100", kg: 4 }),
      linea({ id: "b2", nombre: "ZARZAMORA", sku: "X200072100", kg: 1 }),
      linea({ id: "c1", nombre: "FRESA FRESCA", sku: "X200012100", kg: 3 }),
    ];

    const matched = filterLineasByOrdenTrabajoHija(
      all,
      hija([
        {
          Producto: "FRESA FRESCA",
          "Codigo producto": "X200012100",
          Cantidad: 2,
        },
        {
          Producto: "ZARZAMORA",
          "Codigo producto": "X200072100",
          Cantidad: 0.75,
        },
      ]),
    );

    expect(matched.map((l) => l.id_linea_orden_venta)).toEqual(["a1", "a2"]);
  });

  it("sin hija devuelve todas las líneas", () => {
    const all = [
      linea({ id: "a1", nombre: "FRESA FRESCA", sku: "X1", kg: 2 }),
    ];
    expect(filterLineasByOrdenTrabajoHija(all, null)).toHaveLength(1);
  });
});
