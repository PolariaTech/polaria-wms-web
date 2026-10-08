import { describe, expect, it } from "vitest";
import {
  formatEstadoOrdenVenta,
  puedeEditarOrdenVenta,
} from "./sales-status";

describe("puedeEditarOrdenVenta", () => {
  it("permite los 4 estados de negocio", () => {
    expect(puedeEditarOrdenVenta("por_confirmar")).toBe(true);
    expect(puedeEditarOrdenVenta("confirmada")).toBe(true);
    expect(puedeEditarOrdenVenta("alistamiento")).toBe(true);
    expect(puedeEditarOrdenVenta("alistada")).toBe(true);
  });

  it("bloquea estados legados fuera del modelo", () => {
    expect(puedeEditarOrdenVenta("en_preparacion")).toBe(false);
    expect(puedeEditarOrdenVenta("parcialmente_despachada")).toBe(false);
    expect(puedeEditarOrdenVenta("despachada")).toBe(false);
    expect(puedeEditarOrdenVenta("cerrada")).toBe(false);
    expect(puedeEditarOrdenVenta("cancelada")).toBe(false);
  });
});

describe("formatEstadoOrdenVenta", () => {
  it("usa las 4 etiquetas canónicas", () => {
    expect(formatEstadoOrdenVenta("por_confirmar")).toBe("Por confirmar");
    expect(formatEstadoOrdenVenta("confirmada")).toBe("Confirmada");
    expect(formatEstadoOrdenVenta("alistamiento")).toBe("Alistamiento");
    expect(formatEstadoOrdenVenta("alistada")).toBe("Alistado");
  });

  it("normaliza legados a las 4 etiquetas", () => {
    expect(formatEstadoOrdenVenta("borrador")).toBe("Por confirmar");
    expect(formatEstadoOrdenVenta("en_preparacion")).toBe("Alistamiento");
    expect(formatEstadoOrdenVenta("despachada")).toBe("Alistado");
  });
});
