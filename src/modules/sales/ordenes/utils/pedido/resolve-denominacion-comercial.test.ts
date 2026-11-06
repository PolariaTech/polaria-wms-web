import { describe, expect, it } from "vitest";
import {
  overrideDenominacionParaPersistir,
  resolveDenominacionComercial,
} from "./resolve-denominacion-comercial";

describe("resolveDenominacionComercial (REQ-241)", () => {
  it("prioriza override sobre apodo sync", () => {
    expect(
      resolveDenominacionComercial({
        override: "Luis",
        apodoSincronizado: "Lucho",
      }),
    ).toBe("Luis");
  });

  it("usa apodo si no hay override", () => {
    expect(
      resolveDenominacionComercial({
        override: "  ",
        apodoSincronizado: "Lucho",
      }),
    ).toBe("Lucho");
  });
});

describe("overrideDenominacionParaPersistir (REQ-241)", () => {
  it("guarda override solo si difiere del apodo", () => {
    expect(
      overrideDenominacionParaPersistir({
        valorFormulario: "Luis",
        apodoSincronizado: "Lucho",
      }),
    ).toBe("Luis");
  });

  it("limpia override si el valor es el del sync", () => {
    expect(
      overrideDenominacionParaPersistir({
        valorFormulario: "Lucho",
        apodoSincronizado: "Lucho",
      }),
    ).toBeNull();
  });

  it("limpia override si el valor está vacío", () => {
    expect(
      overrideDenominacionParaPersistir({
        valorFormulario: "   ",
        apodoSincronizado: "Lucho",
      }),
    ).toBeNull();
  });
});
