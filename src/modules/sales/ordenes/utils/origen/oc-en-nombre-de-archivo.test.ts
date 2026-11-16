import { describe, expect, it } from "vitest";
import { nombreTraeOc } from "./oc-en-nombre-de-archivo";

describe("nombreTraeOc", () => {
  it("reconoce la OC larga cuando el nombre trae sus últimos dígitos", () => {
    expect(nombreTraeOc("OC-140188-AGUACATES.pdf", "4500140188")).toBe(true);
  });

  it("no confunde la OC de otra OV hermana", () => {
    expect(nombreTraeOc("OC-140182-AGUACATES.pdf", "4500140188")).toBe(false);
  });

  it("un nombre sin número de OC no coincide", () => {
    expect(nombreTraeOc("C.PRINCIPAL (AGUACATES P.).pdf", "390693")).toBe(false);
  });

  it("el nombre con la OC completa coincide", () => {
    expect(nombreTraeOc("4500140188.pdf", "4500140188")).toBe(true);
  });

  it("OC corta: coincide cuando un tramo de dígitos es igual", () => {
    expect(nombreTraeOc("OC 50734 Aguacate beef bar.pdf", "50734")).toBe(true);
    expect(nombreTraeOc("OC 50728 Aguacate mistura.pdf", "50734")).toBe(false);
  });

  it("OC con letras: compara por sus dígitos", () => {
    expect(nombreTraeOc("OC PO4970 AGUACATES PUEBLA (COMEDOR).pdf", "PO4970")).toBe(true);
    expect(nombreTraeOc("OC PO4971 AGUACATES PUEBLA (COCINA).pdf", "PO4970")).toBe(false);
    expect(nombreTraeOc("PCMC-PO-063314 AGUACATES DE PUEBLA SA DE CV.pdf", "PCMC-PO-063314")).toBe(true);
  });

  it("OC larga en el nombre completa o distinta", () => {
    expect(nombreTraeOc("AGUACATES DE PUEBLA_4502995248_AVA.pdf", "4502995248")).toBe(true);
    expect(nombreTraeOc("AGUACATES DE PUEBLA_4502995248_AVA.pdf", "4502995251")).toBe(false);
    expect(nombreTraeOc("Solicitudes de pedido - 10111808 BANQUETES AGUACATES.pdf", "10111808")).toBe(true);
  });

  it("una OC con menos de 4 dígitos, vacía o sin dígitos no coincide con nada", () => {
    expect(nombreTraeOc("OC-123.pdf", "123")).toBe(false);
    expect(nombreTraeOc("OC-140188.pdf", "")).toBe(false);
    expect(nombreTraeOc("OC-140188.pdf", null)).toBe(false);
    expect(nombreTraeOc("OC-140188.pdf", undefined)).toBe(false);
    expect(nombreTraeOc("OC-140188.pdf", "STERIORMENTE")).toBe(false);
  });

  it("normaliza la OC con letras, espacios o guiones a sus dígitos", () => {
    expect(nombreTraeOc("OC-140188.pdf", "OC 4500-140188")).toBe(true);
  });
});
