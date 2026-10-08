import { describe, expect, it } from "vitest";
import {
  assignOtIdsToFormLineas,
  buildOtIdByDetalleLineaId,
  filterLineasByOrdenTrabajoHija,
} from "./filter-lineas-by-orden-trabajo";
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

  it("empareja BLUE BERRY del correo con ARÁNDANOS/BLUEBERRIES del catálogo", () => {
    const all = [
      linea({
        id: "b1",
        nombre: "ARÁNDANOS/BLUEBERRIES",
        sku: "105001507",
        kg: 0.8,
      }),
      linea({ id: "f1", nombre: "FRESAS", sku: "105001503", kg: 0.5 }),
    ];

    const matched = filterLineasByOrdenTrabajoHija(
      all,
      hija([
        { Producto: "BLUE BERRY", "Codigo producto": "", Cantidad: 0.8 },
        { Producto: "FRESA FRESCA", "Codigo producto": "", Cantidad: 0.5 },
      ]),
    );

    expect(matched.map((l) => l.id_linea_orden_venta)).toEqual(["b1", "f1"]);
  });
});

describe("buildOtIdByDetalleLineaId", () => {
  it("asigna cada línea a su OT sin cruzar el mismo SKU", () => {
    const all = [
      linea({ id: "a1", nombre: "FRESA FRESCA", sku: "X200012100", kg: 2 }),
      linea({ id: "b1", nombre: "FRESA FRESCA", sku: "X200012100", kg: 4 }),
    ];
    const hijas: OrdenTrabajoHija[] = [
      {
        ...hija([
          {
            Producto: "FRESA FRESCA",
            "Codigo producto": "X200012100",
            Cantidad: 2,
          },
        ]),
        id: "ot-a",
      },
      {
        ...hija([
          {
            Producto: "FRESA FRESCA",
            "Codigo producto": "X200012100",
            Cantidad: 4,
          },
        ]),
        id: "ot-b",
        label: "451 — Otro",
        numeroPedido: "451",
        almacen: "Otro",
      },
    ];

    const map = buildOtIdByDetalleLineaId(all, hijas);
    expect(map.get("a1")).toBe("ot-a");
    expect(map.get("b1")).toBe("ot-b");
  });
});

describe("assignOtIdsToFormLineas", () => {
  it("empareja por nombre aunque el sku esté archivado", () => {
    const form = [
      {
        nombre: "FRESA FRESCA",
        codigo: "ARCH-abc",
        cantidadInput: "2",
      },
      {
        nombre: "FRESA FRESCA",
        codigo: "ARCH-def",
        cantidadInput: "4",
      },
    ];
    const hijas: OrdenTrabajoHija[] = [
      {
        ...hija([
          {
            Producto: "FRESA FRESCA",
            "Codigo producto": "X200012100",
            Cantidad: 2,
          },
        ]),
        id: "ot-a",
      },
      {
        ...hija([
          {
            Producto: "FRESA FRESCA",
            "Codigo producto": "X200012100",
            Cantidad: 4,
          },
        ]),
        id: "ot-b",
        label: "451 — Otro",
        numeroPedido: "451",
        almacen: "Otro",
      },
    ];

    const assigned = assignOtIdsToFormLineas(form, hijas, (raw) =>
      Number(raw),
    );
    expect(assigned[0]?.otId).toBe("ot-a");
    expect(assigned[1]?.otId).toBe("ot-b");
  });

  it("no mezcla líneas de otra OT al filtrar", () => {
    const all = [
      linea({ id: "a1", nombre: "FRESA FRESCA", sku: "ARCH-1", kg: 2 }),
      linea({ id: "b1", nombre: "LIMON", sku: "ARCH-2", kg: 10 }),
    ].map((l) => ({
      ...l,
      matchNombre: l.producto.descripcion,
      matchCodigo: l.producto.sku,
    }));

    const matched = filterLineasByOrdenTrabajoHija(
      all,
      hija([
        {
          Producto: "FRESA FRESCA",
          "Codigo producto": "X200012100",
          Cantidad: 2,
        },
      ]),
    );

    expect(matched.map((l) => l.id_linea_orden_venta)).toEqual(["a1"]);
  });

  it("empatar JASS≈HASS y no volcar el resto de la venta", () => {
    const all = [
      linea({ id: "ag", nombre: "AGUACATE HASS", sku: "ARCH-1", kg: 37 }),
      linea({ id: "bb", nombre: "BLUE BERRY", sku: "ARCH-2", kg: 0.5 }),
      linea({ id: "fr", nombre: "FRAMBUESA", sku: "ARCH-3", kg: 0.5 }),
      linea({ id: "fs", nombre: "FRESA FRESCA", sku: "ARCH-4", kg: 1 }),
    ].map((l) => ({
      ...l,
      matchNombre: l.producto.descripcion,
      matchCodigo: l.producto.sku,
    }));

    const matched = filterLineasByOrdenTrabajoHija(
      all,
      hija([
        {
          Producto: "AGUACATE JASS",
          "Codigo producto": "X200011700",
          Cantidad: 37,
        },
      ]),
      { emptyFallback: "none" },
    );

    expect(matched.map((l) => l.id_linea_orden_venta)).toEqual(["ag"]);
  });
});
