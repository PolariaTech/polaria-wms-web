import { describe, expect, it } from "vitest";
import {
  isFechaEntregaAtrasada,
  isVentanaDesdeMayorQueHasta,
  validatePedidoCabecera,
} from "./pedido-form-validation";

describe("isVentanaDesdeMayorQueHasta", () => {
  it("es falsa si falta desde o hasta", () => {
    expect(isVentanaDesdeMayorQueHasta("", "10:00")).toBe(false);
    expect(isVentanaDesdeMayorQueHasta("08:00", "")).toBe(false);
    expect(isVentanaDesdeMayorQueHasta("", "")).toBe(false);
  });

  it("es verdadera solo cuando desde es posterior a hasta", () => {
    expect(isVentanaDesdeMayorQueHasta("14:00", "10:00")).toBe(true);
    expect(isVentanaDesdeMayorQueHasta("10:00", "14:00")).toBe(false);
    expect(isVentanaDesdeMayorQueHasta("10:00", "10:00")).toBe(false);
  });
});

describe("isFechaEntregaAtrasada", () => {
  it("es verdadera solo con fecha anterior a hoy", () => {
    expect(isFechaEntregaAtrasada("2026-09-13", "2026-09-14")).toBe(true);
    expect(isFechaEntregaAtrasada("2026-09-14", "2026-09-14")).toBe(false);
    expect(isFechaEntregaAtrasada("2026-09-15", "2026-09-14")).toBe(false);
    expect(isFechaEntregaAtrasada("", "2026-09-14")).toBe(false);
  });
});

describe("validatePedidoCabecera", () => {
  it("exige fecha de entrega", () => {
    expect(
      validatePedidoCabecera({
        fechaEntrega: "",
        todayIso: "2026-09-14",
        ventanaDesde: "",
        ventanaHasta: "",
      }),
    ).toEqual({
      message: "Ingresa la fecha de entrega.",
      fields: ["fechaEntrega"],
    });
  });

  it("acepta una fecha anterior a hoy (solo advertencia, no bloqueo)", () => {
    expect(
      validatePedidoCabecera({
        fechaEntrega: "2026-09-13",
        todayIso: "2026-09-14",
        ventanaDesde: "08:00",
        ventanaHasta: "12:00",
      }),
    ).toBeNull();
  });

  it("acepta hoy y una ventana válida", () => {
    expect(
      validatePedidoCabecera({
        fechaEntrega: "2026-09-14",
        todayIso: "2026-09-14",
        ventanaDesde: "08:00",
        ventanaHasta: "12:00",
      }),
    ).toBeNull();
  });

  it("rechaza ventana desde posterior a hasta", () => {
    expect(
      validatePedidoCabecera({
        fechaEntrega: "2026-09-14",
        todayIso: "2026-09-14",
        ventanaDesde: "16:00",
        ventanaHasta: "10:00",
      }),
    ).toEqual({
      message: 'La ventana "desde" no puede ser mayor que "hasta".',
      fields: ["ventanaDesde", "ventanaHasta"],
    });
  });
});
