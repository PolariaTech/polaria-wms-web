import { describe, expect, it } from "vitest";
import {
  atributosCalidadDesdeSolicitado,
  calibresDesdeSolicitado,
} from "./atributos-calidad-desde-solicitado";

describe("atributosCalidadDesdeSolicitado (REQ-363)", () => {
  it("saca la calidad del paréntesis del nombre solicitado", () => {
    expect(
      atributosCalidadDesdeSolicitado("Coliflor Blanca (Sin Oxidacion)"),
    ).toEqual(["Sin Oxidacion"]);
  });

  it("ignora paréntesis que solo son unidad/cantidad", () => {
    expect(atributosCalidadDesdeSolicitado("Tomate (20 KG)")).toEqual([]);
    expect(atributosCalidadDesdeSolicitado("Tomate (KGM)")).toEqual([]);
  });

  it("detecta «sin …» fuera de paréntesis", () => {
    expect(atributosCalidadDesdeSolicitado("Elote sin penacho")).toEqual([
      "sin penacho",
    ]);
  });

  it("no repite la variedad que ya va en el nombre de catálogo", () => {
    expect(
      atributosCalidadDesdeSolicitado("LIMON PERSA (SIN SEMILLA)", {
        nombreCatalogo: "LIMON PERSA (SIN SEMILLA)",
      }),
    ).toEqual([]);
    expect(
      atributosCalidadDesdeSolicitado("Coliflor Blanca (Sin Oxidacion)", {
        nombreCatalogo: "COLIFLOR",
      }),
    ).toEqual(["Sin Oxidacion"]);
  });

  it("REQ-346: saca calibre/talla del artículo (regla general)", () => {
    expect(atributosCalidadDesdeSolicitado("APIO DE 24 A 30 CM")).toEqual([
      "DE 24 A 30 CM",
    ]);
    expect(atributosCalidadDesdeSolicitado("CALABAZA ITALIANA 15 CM")).toEqual([
      "15 CM",
    ]);
    expect(
      atributosCalidadDesdeSolicitado("AGUACATE HASS DE 210 A 230 GR"),
    ).toEqual(["DE 210 A 230 GR"]);
    expect(atributosCalidadDesdeSolicitado("CHILE POBLANO DE 12 CM")).toEqual([
      "DE 12 CM",
    ]);
  });
});

describe("calibresDesdeSolicitado (REQ-346)", () => {
  it("no inventa calibre si el nombre no trae medida", () => {
    expect(calibresDesdeSolicitado("CEBOLLA CAMBRAY")).toEqual([]);
  });
});
