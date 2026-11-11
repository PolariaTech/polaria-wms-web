import { describe, expect, it } from "vitest";
import type { ProductoVentaOption } from "../../../shared/types/sales.types";
import { codigoContradiceNombre } from "./codigo-contradice-nombre";

function productoVenta(
  parcial: Pick<ProductoVentaOption, "idProducto" | "codigo" | "nombre">,
): ProductoVentaOption {
  return {
    label: `${parcial.nombre} (${parcial.codigo})`,
    idCliente: null,
    idBodega: "b1",
    kgDisponible: 10,
    precioUnitario: 1,
    unidadMedida: "kg",
    ...parcial,
  };
}

const AGUACATE_EXTRA = productoVenta({
  idProducto: "p-aguacate-extra",
  codigo: "115001005",
  nombre: "AGUACATE EXTRA",
});
const AGUACATE_PRIMERA = productoVenta({
  idProducto: "p-aguacate-primera",
  codigo: "115001009",
  nombre: "AGUACATE PRIMERA",
});
const FRAMBUESAS_DOMO = productoVenta({
  idProducto: "p-frambuesas",
  codigo: "10501529",
  nombre: "FRAMBUESAS (DOMO)",
});
const ARANDANOS = productoVenta({
  idProducto: "p-arandanos",
  codigo: "105001507",
  nombre: "ARÁNDANOS",
});
const AJO = productoVenta({
  idProducto: "p-ajo",
  codigo: "115001201",
  nombre: "AJO",
});
const LIMON_PERSA = productoVenta({
  idProducto: "p-limon",
  codigo: "115001400",
  nombre: "LIMON PERSA (SIN SEMILLA)",
});
const BROCOLI = productoVenta({
  idProducto: "p-brocoli",
  codigo: "105001500",
  nombre: "BROCOLI",
});
const PINA = productoVenta({
  idProducto: "p-pina",
  codigo: "105001508",
  nombre: "PIÑA",
});

describe("codigoContradiceNombre (REQ-299)", () => {
  it.each([
    {
      caso: "Pepino + SKU de AGUACATE EXTRA",
      texto: "Pepino",
      codigo: "115001005",
      producto: AGUACATE_EXTRA,
      contradice: true,
    },
    {
      caso: "Cebolla Blanca + SKU de AGUACATE PRIMERA",
      texto: "Cebolla Blanca",
      codigo: "115001009",
      producto: AGUACATE_PRIMERA,
      contradice: true,
    },
    {
      caso: "LIMON PERSA (SIN SEMILLA) + SKU de FRAMBUESAS",
      texto: "LIMON PERSA (SIN SEMILLA)",
      codigo: "10501529",
      producto: FRAMBUESAS_DOMO,
      contradice: true,
    },
    {
      caso: "MORA + SKU de ARÁNDANOS",
      texto: "MORA",
      codigo: "105001507",
      producto: ARANDANOS,
      contradice: true,
    },
    {
      caso: "zarzamora + SKU de ARÁNDANOS",
      texto: "zarzamora",
      codigo: "105001507",
      producto: ARANDANOS,
      contradice: true,
    },
    {
      caso: "AGUACATE HASS PRIMERA + su SKU",
      texto: "AGUACATE HASS PRIMERA",
      codigo: "115001009",
      producto: AGUACATE_PRIMERA,
      contradice: false,
    },
    {
      caso: "Ajo limpio por kilo en BOTE + su SKU",
      texto: "Ajo limpio por kilo en BOTE",
      codigo: "115001201",
      producto: AJO,
      contradice: false,
    },
    {
      caso: "limón + SKU de LIMON PERSA",
      texto: "limón",
      codigo: "115001400",
      producto: LIMON_PERSA,
      contradice: false,
    },
    {
      caso: "brócoli pata corta + su SKU",
      texto: "brócoli pata corta",
      codigo: "105001500",
      producto: BROCOLI,
      contradice: false,
    },
    {
      caso: "PI¥A MIEL + SKU de PIÑA",
      texto: "PI¥A MIEL",
      codigo: "105001508",
      producto: PINA,
      contradice: false,
    },
    {
      caso: "texto vacío + código",
      texto: "",
      codigo: "115001005",
      producto: AGUACATE_EXTRA,
      contradice: false,
    },
    {
      caso: "código vacío no contradice",
      texto: "Pepino",
      codigo: "",
      producto: AGUACATE_EXTRA,
      contradice: false,
    },
    {
      caso: "código de otro producto no aplica a este",
      texto: "Pepino",
      codigo: "999",
      producto: AGUACATE_EXTRA,
      contradice: false,
    },
  ] as const)("$caso", ({ texto, codigo, producto, contradice }) => {
    expect(codigoContradiceNombre(texto, codigo, producto)).toBe(contradice);
  });
});
