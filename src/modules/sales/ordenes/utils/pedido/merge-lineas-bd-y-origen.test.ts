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
