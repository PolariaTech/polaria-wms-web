import { describe, expect, it } from "vitest";
import type { ProductoVentaOption } from "@/modules/sales/shared/types/sales.types";
import type { OrigenCorreoRenglon } from "../origen/origen-correo-ordenes-trabajo";
import { lineaSembradaDesdeRenglon } from "./linea-sembrada-desde-origen";

const AGUACATE: ProductoVentaOption = {
  idProducto: "prod-1",
  label: "AGUACATE HASS (AGU-01)",
  idCliente: null,
  idBodega: "bod-1",
  codigo: "AGU-01",
  nombre: "AGU-01 AGUACATE HASS",
  kgDisponible: 120,
  precioUnitario: 46,
  unidadMedida: "KG",
};

const renglon = (parcial: Partial<OrigenCorreoRenglon> = {}): OrigenCorreoRenglon => ({
  Producto: "Aguacate Hass extra",
  Cantidad: 10,
  Precio: 50,
  "Codigo producto": "4852",
  ...parcial,
});

describe("lineaSembradaDesdeRenglon (REQ-201)", () => {
  it("un renglón sin verificar nace pendiente de catálogo, con el nombre del correo como alias", () => {
    const linea = lineaSembradaDesdeRenglon({ row: renglon(), productos: [], otId: "ot-1" });

    expect(linea).toMatchObject({
      idProducto: "",
      nombre: "Aguacate Hass extra",
      aliasCliente: "Aguacate Hass extra",
      catalogPending: true,
      filledByIa: true,
      otId: "ot-1",
      precioUnitario: 50,
      precioManual: true,
    });
  });

  it("sin nombre usa «Producto del correo» y sin código lo deja en una raya", () => {
    const linea = lineaSembradaDesdeRenglon({
      row: renglon({ Producto: "  ", "Codigo producto": undefined }),
      productos: [],
      otId: "ot-1",
    });

    expect(linea.nombre).toBe("Producto del correo");
    expect(linea.codigo).toBe("—");
  });

  it("un renglón ya verificado nace con el producto del catálogo y no pide match", () => {
    const linea = lineaSembradaDesdeRenglon({
      row: renglon({ _idProducto: "prod-1" }),
      productos: [AGUACATE],
      otId: "ot-2",
    });

    expect(linea).toMatchObject({
      idProducto: "prod-1",
      nombre: "AGUACATE HASS",
      codigo: "AGU-01",
      idBodega: "bod-1",
      kgDisponible: 120,
      aliasCliente: "Aguacate Hass extra",
      catalogPending: false,
      catalogAmbiguo: false,
      filledByIa: false,
      sugerencia: null,
      sugerenciasAlternativas: [],
      otId: "ot-2",
    });
    expect(linea.cantidadInput).not.toBe("");
  });

  it("verificado: el precio del documento manda y se marca como manual", () => {
    const linea = lineaSembradaDesdeRenglon({
      row: renglon({ _idProducto: "prod-1", Precio: 52 }),
      productos: [AGUACATE],
      otId: "ot-1",
    });

    expect(linea.precioUnitario).toBe(52);
    expect(linea.precioManual).toBe(true);
  });

  it("verificado sin precio en el documento: usa el del catálogo y no es manual", () => {
    const linea = lineaSembradaDesdeRenglon({
      row: renglon({ _idProducto: "prod-1", Precio: undefined }),
      productos: [AGUACATE],
      otId: "ot-1",
    });

    expect(linea.precioUnitario).toBe(46);
    expect(linea.precioManual).toBe(false);
  });

  it("si el producto verificado ya no está en el catálogo, vuelve al flujo normal (pendiente)", () => {
    const linea = lineaSembradaDesdeRenglon({
      row: renglon({ _idProducto: "prod-borrado" }),
      productos: [AGUACATE],
      otId: "ot-1",
    });

    expect(linea.catalogPending).toBe(true);
    expect(linea.idProducto).toBe("");
  });

  it("REQ-299: no sugiere AGUACATE cuando el renglón pide Pepino con SKU 115001005", () => {
    const aguacateExtra: ProductoVentaOption = {
      idProducto: "p-aguacate-extra",
      label: "AGUACATE EXTRA (115001005)",
      idCliente: null,
      idBodega: "bod-1",
      codigo: "115001005",
      nombre: "AGUACATE EXTRA",
      kgDisponible: 40,
      precioUnitario: 90,
      unidadMedida: "kg",
    };
    const pepino: ProductoVentaOption = {
      idProducto: "p-pepino",
      label: "PEPINO (115001300)",
      idCliente: null,
      idBodega: "bod-1",
      codigo: "115001300",
      nombre: "PEPINO",
      kgDisponible: 80,
      precioUnitario: 20,
      unidadMedida: "kg",
    };
    const linea = lineaSembradaDesdeRenglon({
      row: renglon({
        Producto: "Pepino",
        "Codigo producto": "115001005",
      }),
      productos: [aguacateExtra, pepino],
      otId: "ot-1",
    });

    expect(linea.catalogPending).toBe(true);
    expect(linea.idProducto).toBe("");
    expect(linea.sugerencia?.idProducto).not.toBe("p-aguacate-extra");
  });
});
