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

describe("lineaSembradaDesdeRenglon propuestaSistema", () => {
  it("una línea pendiente nace con producto null", () => {
    const linea = lineaSembradaDesdeRenglon({
      row: renglon(),
      productos: [],
      otId: "ot-1",
    });
    expect(linea.propuestaSistema).toEqual({ producto: null, fuente: null });
  });

  it("una línea verificada nace con fuente verificado", () => {
    const linea = lineaSembradaDesdeRenglon({
      row: renglon({ _idProducto: "prod-1" }),
      productos: [AGUACATE],
      otId: "ot-2",
    });
    expect(linea.propuestaSistema).toEqual({
      producto: null,
      fuente: "verificado",
    });
  });
});
