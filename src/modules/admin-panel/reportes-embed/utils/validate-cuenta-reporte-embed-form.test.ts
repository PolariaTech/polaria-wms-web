import { describe, expect, it } from "vitest";
import { validateCuentaReporteEmbedForm } from "./validate-cuenta-reporte-embed-form";

describe("validateCuentaReporteEmbedForm", () => {
  it("exige descripción", () => {
    expect(
      validateCuentaReporteEmbedForm({
        descripcion: "  ",
        embedUrl: "https://example.com/r",
      }),
    ).toBe("La descripción del reporte es obligatoria.");
  });

  it("exige URL válida", () => {
    expect(
      validateCuentaReporteEmbedForm({
        descripcion: "Inventario",
        embedUrl: "no-es-url",
      }),
    ).toBe("Ingresa una URL válida (https://…).");
  });

  it("acepta descripción y URL http(s)", () => {
    expect(
      validateCuentaReporteEmbedForm({
        descripcion: "Inventario",
        embedUrl: "https://lookerstudio.google.com/embed/reporting/8319190c-7a5c-48b2-9b1d-84701d583dd9",
      }),
    ).toBeNull();
  });
});
