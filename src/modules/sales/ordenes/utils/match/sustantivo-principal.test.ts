import { describe, expect, it } from "vitest";
import type { ProductoVentaOption } from "../../../shared/types/sales.types";
import {
  rankSinFamiliaAjena,
  sustantivoPrincipalAusente,
} from "./sustantivo-principal";

function producto(
  codigo: string,
  nombre: string,
): ProductoVentaOption {
  return {
    idProducto: codigo,
    label: `${nombre} (${codigo})`,
    idCliente: null,
    idBodega: "b1",
    codigo,
    nombre,
    kgDisponible: 10,
    precioUnitario: 1,
    unidadMedida: "kg",
  };
}

const PULPA_ROJOS = producto("115001418", "PULPA DE FRUTOS ROJOS");
const RECADO_ROJO = producto("10501542", "RECADO ROJO");
const CHILE_ROJO = producto("10501521", "CHILE MORRON ROJO");
const CHILE_VERDE = producto("10501520", "CHILE MORRON VERDE");
const CHILE_AMARILLO = producto("10501522", "CHILE MORRON AMARILLO");
const CHILE_NARANJA = producto("10501531", "CHILE MORRON NARANJA");
const CHILE_ANCHO = producto("115001436", "CHILE ANCHO");
const AGUACATE_PRIMERA = producto(
  "115001009",
  "AGUACATE PRIMERA (170 a 200g)",
);
const AGUACATE_HASS = producto("115001000", "AGUACATE  HASS");
const NARANJA = producto("115001406", "NARANJA");
const NARANJA_VERACRUZ = producto("10501544", "NARANJA DULCE VERACRUZ");
const NARANJA_AMERICANA = producto("115001454", "NARANJA AMERICANA");
const PULPA_MANGO = producto("105001511", "PULPA DE MANGO");

const CATALOGO = [
  PULPA_ROJOS,
  RECADO_ROJO,
  CHILE_ROJO,
  CHILE_VERDE,
  CHILE_AMARILLO,
  CHILE_NARANJA,
  CHILE_ANCHO,
  AGUACATE_PRIMERA,
  AGUACATE_HASS,
  NARANJA,
  NARANJA_VERACRUZ,
  NARANJA_AMERICANA,
  PULPA_MANGO,
];

describe("sustantivoPrincipalAusente", () => {
  it.each([
    {
      caso: "Pimiento rojo no cubre PULPA",
      texto: "Pimiento rojo",
      prod: PULPA_ROJOS,
      ausente: true,
    },
    {
      caso: "Pimiento rojo sí cubre CHILE MORRON ROJO",
      texto: "Pimiento rojo",
      prod: CHILE_ROJO,
      ausente: false,
    },
    {
      caso: "Naranja Primera no cubre AGUACATE",
      texto: "Naranja Primera (10 cm diam jugosa, piel lisa)",
      prod: AGUACATE_PRIMERA,
      ausente: true,
    },
    {
      caso: "Naranja Primera sí cubre NARANJA",
      texto: "Naranja Primera (10 cm diam jugosa, piel lisa)",
      prod: NARANJA,
      ausente: false,
    },
    {
      caso: "Naranja Primera sí cubre NARANJA DULCE VERACRUZ",
      texto: "Naranja Primera (10 cm diam jugosa, piel lisa)",
      prod: NARANJA_VERACRUZ,
      ausente: false,
    },
    {
      caso: "AGUACATE HASS PRIMERA sí cubre AGUACATE PRIMERA",
      texto: "AGUACATE HASS PRIMERA",
      prod: AGUACATE_PRIMERA,
      ausente: false,
    },
    {
      caso: "Pulpa de mango sí cubre PULPA DE MANGO",
      texto: "Pulpa de mango",
      prod: PULPA_MANGO,
      ausente: false,
    },
    {
      caso: "el código del producto en el texto no se descarta",
      texto: "rojo 115001418",
      prod: PULPA_ROJOS,
      ausente: false,
    },
  ] as const)("$caso", ({ texto, prod, ausente }) => {
    expect(sustantivoPrincipalAusente(texto, prod)).toBe(ausente);
  });
});

describe("rankSinFamiliaAjena", () => {
  function codigos(query: string): string[] {
    return rankSinFamiliaAjena(query, CATALOGO).candidates.map(
      (c) => c.producto.codigo,
    );
  }

  it("Pimiento rojo no deja PULPA DE FRUTOS ROJOS ni RECADO ROJO", () => {
    const ranked = codigos("Pimiento rojo");
    expect(ranked).not.toContain("115001418");
    expect(ranked).not.toContain("10501542");
    expect(ranked[0]).toBe("10501521");
  });

  it("Naranja Primera no deja AGUACATE PRIMERA", () => {
    expect(
      codigos("Naranja Primera (10 cm diam jugosa, piel lisa)"),
    ).not.toContain("115001009");
  });

  it("Pimiento morrón AMARILLO rankea CHILE MORRON AMARILLO", () => {
    expect(codigos("Pimiento morrón AMARILLO por kilo")[0]).toBe("10501522");
  });

  it("Pimiento verde rankea CHILE MORRON VERDE", () => {
    expect(codigos("Pimiento verde")[0]).toBe("10501520");
  });

  it("Frutos rojos puede rankear PULPA: el catálogo no tiene frutos rojos frescos", () => {
    expect(codigos("Frutos rojos")[0]).toBe("115001418");
  });
});
