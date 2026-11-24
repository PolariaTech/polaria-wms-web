import { describe, expect, it } from "vitest";
import { buildSurtidoNotasAlmacen, deriveTurnoSurtido } from "./sync-surtido-notas-almacen";

describe("deriveTurnoSurtido", () => {
  it("combina turnos PM y noche", () => {
    expect(deriveTurnoSurtido({ campos: {}, checks: { turnoPm: true, turnoNocheAm: true }, lineas: [] })).toBe(
      "PM / Noche-AM",
    );
    expect(deriveTurnoSurtido({ campos: {}, checks: { turnoPm: true }, lineas: [] })).toBe("PM");
  });
});

describe("buildSurtidoNotasAlmacen", () => {
  it("incluye folio de factura e incidencias", () => {
    const text = buildSurtidoNotasAlmacen({
      campos: { facturaAsociada: "F-99", incidencias: "Retraso" },
      checks: { mercanciaCoincide: true },
      lineas: [],
    });
    expect(text).toContain("Folio factura asociada: F-99");
    expect(text).toContain("Incidencias: Retraso");
    expect(text).toContain("Mercancía coincide");
  });
});