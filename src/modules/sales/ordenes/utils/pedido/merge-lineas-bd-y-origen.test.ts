import { describe, expect, it } from "vitest";
import { createEmptyOrdenTrabajoHija } from "../origen/origen-correo-ordenes-trabajo";
import type { LineaVentaForm } from "../../types/orden-venta-create-modal.types";
import { mergeLineasBdConOrigenPendiente } from "./merge-lineas-bd-y-origen";

function lineaBd(parcial: Partial<LineaVentaForm> & { otId: string }): LineaVentaForm {
  return {
    idProducto: "prod-1",
    nombre: "Aguacate",
    codigo: "100",
    idBodega: "bod-1",
    cantidadInput: "1",
    cajasInput: "",
    presentacion: "",
    especificacion: "",
    descuentoPctInput: "",
    ivaPct: "0",
    kgDisponible: 10,
    unidadMedida: "KGM",
    precioUnitario: 5,
    precioInput: "5",
    catalogPending: false,
    catalogAmbiguo: false,
    sugerencia: null,
    sugerenciasAlternativas: [],
    ...parcial,
  };
}

describe("mergeLineasBdConOrigenPendiente (REQ-236)", () => {
  it("añade renglones de origen que no están en BD y reaplica _idProducto", () => {
    const hija = createEmptyOrdenTrabajoHija({
      id: "ot-1",
      almacen: "Cocina",
    });
    hija.renglones = [
      { Producto: "Aguacate", Cantidad: 1, _idProducto: "prod-1" },
      {
        Producto: "Tomate",
        Cantidad: 2,
        _idProducto: "prod-2",
      },
    ];

    const productos = [
      {
        idProducto: "prod-1",
        codigo: "100",
        nombre: "Aguacate Hass",
        idBodega: "bod-1",
        kgDisponible: 10,
        unidadMedida: "KGM",
        precioUnitario: 5,
      },
      {
        idProducto: "prod-2",
        codigo: "200",
        nombre: "Tomate",
        idBodega: "bod-1",
        kgDisponible: 8,
        unidadMedida: "KGM",
        precioUnitario: 3,
      },
    ];

    const fusion = mergeLineasBdConOrigenPendiente({
      lineasBd: [lineaBd({ otId: "ot-1", idProducto: "prod-1" })],
      hijas: [hija],
      origenRows: hija.renglones,
      productos,
    });

    expect(fusion).toHaveLength(2);
    expect(fusion[0]?.idProducto).toBe("prod-1");
    expect(fusion[0]?.catalogPending).toBe(false);
    expect(fusion[1]?.idProducto).toBe("prod-2");
    expect(fusion[1]?.catalogPending).toBe(false);
    expect(fusion[1]?.otId).toBe("ot-1");
  });

  it("no duplica si BD ya cubre todos los renglones de la OT", () => {
    const hija = createEmptyOrdenTrabajoHija({ id: "ot-1", almacen: "Bar" });
    hija.renglones = [{ Producto: "Limón", Cantidad: 1 }];
    const fusion = mergeLineasBdConOrigenPendiente({
      lineasBd: [
        lineaBd({ otId: "ot-1", idProducto: "prod-9", nombre: "Limón" }),
      ],
      hijas: [hija],
      origenRows: hija.renglones,
      productos: [],
    });
    expect(fusion).toHaveLength(1);
  });
});

describe("mergeLineasBdConOrigenPendiente — renglón descartado al materializar (REQ-309, OV-1569)", () => {
  const hija = () => {
    const hijaOt = createEmptyOrdenTrabajoHija({ id: "ot-1", almacen: "Cocina" });
    hijaOt.renglones = [
      { Producto: "Jugo de Limón fresco galón de 5 litros", Cantidad: 1, Especificacion: "Fresco" },
      { Producto: "Pimiento morrón ROJO por kilo", Cantidad: 5, Especificacion: "Limpio, sin cáscara" },
      { Producto: "Ajo limpio por kilo en BOTE", Cantidad: 2, Especificacion: "En bote" },
    ];
    return hijaOt;
  };
  const fusionar = (lineasBd: LineaVentaForm[]) => {
    const hijaOt = hija();
    return mergeLineasBdConOrigenPendiente({ lineasBd, hijas: [hijaOt], origenRows: hijaOt.renglones, productos: [] });
  };

  it("el pendiente es el pimiento descartado: no se pierde ni se duplica el jugo", () => {
    const fusion = fusionar([
      lineaBd({ otId: "ot-1", idProducto: "p-jugo", nombre: "JUGO DE LIMON", cantidadInput: "1" }),
      lineaBd({ otId: "ot-1", idProducto: "p-ajo", nombre: "AJO", cantidadInput: "2" }),
    ]);
    expect(fusion).toHaveLength(3);
    const pendientes = fusion.filter((l) => l.catalogPending);
    expect(pendientes).toHaveLength(1);
    expect(pendientes[0]?.aliasCliente).toBe("Pimiento morrón ROJO por kilo");
    expect(fusion.filter((l) => l.aliasCliente?.includes("Jugo"))).toHaveLength(0);
  });

  it("el renglón pendiente conserva su especificación", () => {
    const fusion = fusionar([
      lineaBd({ otId: "ot-1", idProducto: "p-jugo", nombre: "JUGO DE LIMON", cantidadInput: "1" }),
      lineaBd({ otId: "ot-1", idProducto: "p-ajo", nombre: "AJO", cantidadInput: "2" }),
    ]);
    expect(fusion.find((l) => l.catalogPending)?.especificacion).toBe("Limpio · sin cáscara");
  });

  it("control: si están todas las líneas no agrega nada", () => {
    const fusion = fusionar([
      lineaBd({ otId: "ot-1", idProducto: "p-jugo", nombre: "JUGO DE LIMON", cantidadInput: "1" }),
      lineaBd({ otId: "ot-1", idProducto: "p-pim", nombre: "PIMIENTO MORRON ROJO", cantidadInput: "5" }),
      lineaBd({ otId: "ot-1", idProducto: "p-ajo", nombre: "AJO", cantidadInput: "2" }),
    ]);
    expect(fusion).toHaveLength(3);
    expect(fusion.some((l) => l.catalogPending)).toBe(false);
  });

  it("control: si falta la última, el pendiente sigue siendo la última", () => {
    const fusion = fusionar([
      lineaBd({ otId: "ot-1", idProducto: "p-jugo", nombre: "JUGO DE LIMON", cantidadInput: "1" }),
      lineaBd({ otId: "ot-1", idProducto: "p-pim", nombre: "PIMIENTO MORRON ROJO", cantidadInput: "5" }),
    ]);
    expect(fusion.filter((l) => l.catalogPending).map((l) => l.aliasCliente)).toEqual(["Ajo limpio por kilo en BOTE"]);
  });
});
