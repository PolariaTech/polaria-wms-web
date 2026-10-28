import { describe, expect, it } from "vitest";
import {
  estadosSuperioresOrdenVenta,
  formatEstadoOrdenVenta,
  normalizeEstadoOrdenVenta,
  puedeAvanzarEstadoOrdenVenta,
  puedeAccionesAlmacenOrdenVenta,
  puedeBorrarOrdenVenta,
  puedeEditarOrdenVenta,
  puedeEditarOrdenVentaDesdeLista,
} from "./sales-status";

describe("puedeEditarOrdenVenta", () => {
  it("permite los estados de negocio anteriores al despacho", () => {
    expect(puedeEditarOrdenVenta("por_confirmar")).toBe(true);
    expect(puedeEditarOrdenVenta("confirmada")).toBe(true);
    expect(puedeEditarOrdenVenta("alistamiento")).toBe(true);
    expect(puedeEditarOrdenVenta("alistada")).toBe(true);
    expect(puedeEditarOrdenVenta("revisada")).toBe(true);
    expect(puedeEditarOrdenVenta("facturada")).toBe(false);
    expect(puedeEditarOrdenVenta("despachada")).toBe(false);
  });

  it("bloquea estados legados fuera del modelo", () => {
    expect(puedeEditarOrdenVenta("en_preparacion")).toBe(false);
    expect(puedeEditarOrdenVenta("parcialmente_despachada")).toBe(false);
    expect(puedeEditarOrdenVenta("despachada")).toBe(false);
    expect(puedeEditarOrdenVenta("cerrada")).toBe(false);
    expect(puedeEditarOrdenVenta("cancelada")).toBe(false);
  });
});

describe("puedeBorrarOrdenVenta", () => {
  it("solo permite por_confirmar (demás estados deshabilitados)", () => {
    expect(puedeBorrarOrdenVenta("por_confirmar")).toBe(true);
    expect(puedeBorrarOrdenVenta("confirmada")).toBe(false);
    expect(puedeBorrarOrdenVenta("alistamiento")).toBe(false);
    expect(puedeBorrarOrdenVenta("alistada")).toBe(false);
    expect(puedeBorrarOrdenVenta("cancelada")).toBe(false);
  });
});

describe("normalizeEstadoOrdenVenta cancelada", () => {
  it("conserva cancelada (no la mezcla con por_confirmar)", () => {
    expect(normalizeEstadoOrdenVenta("cancelada")).toBe("cancelada");
  });
});

describe("puedeAccionesAlmacenOrdenVenta", () => {
  it("bloquea por_confirmar", () => {
    expect(puedeAccionesAlmacenOrdenVenta("por_confirmar")).toBe(false);
  });

  it("permite desde confirmada", () => {
    expect(puedeAccionesAlmacenOrdenVenta("confirmada")).toBe(true);
    expect(puedeAccionesAlmacenOrdenVenta("alistamiento")).toBe(true);
    expect(puedeAccionesAlmacenOrdenVenta("alistada")).toBe(true);
    expect(puedeAccionesAlmacenOrdenVenta("revisada")).toBe(true);
    expect(puedeAccionesAlmacenOrdenVenta("facturada")).toBe(true);
    expect(puedeAccionesAlmacenOrdenVenta("despachada")).toBe(true);
  });
});

describe("puedeEditarOrdenVentaDesdeLista", () => {
  it("solo permite confirmada", () => {
    expect(puedeEditarOrdenVentaDesdeLista("por_confirmar")).toBe(false);
    expect(puedeEditarOrdenVentaDesdeLista("confirmada")).toBe(true);
    expect(puedeEditarOrdenVentaDesdeLista("alistamiento")).toBe(false);
    expect(puedeEditarOrdenVentaDesdeLista("alistada")).toBe(false);
  });
});

describe("estadosSuperioresOrdenVenta", () => {
  it("desde alistamiento ofrece solo lo que sigue", () => {
    expect(estadosSuperioresOrdenVenta("alistamiento")).toEqual([
      "alistada",
      "revisada",
      "despachada",
      "facturada",
    ]);
  });

  it("desde revisado ofrece despachado y facturado", () => {
    expect(estadosSuperioresOrdenVenta("revisada")).toEqual([
      "despachada",
      "facturada",
    ]);
  });

  it("desde despachado solo ofrece facturado", () => {
    expect(estadosSuperioresOrdenVenta("despachada")).toEqual(["facturada"]);
  });

  it("en facturado no hay botones", () => {
    expect(estadosSuperioresOrdenVenta("facturada")).toEqual([]);
    expect(puedeAvanzarEstadoOrdenVenta("facturada", "despachada")).toBe(
      false,
    );
    expect(puedeAvanzarEstadoOrdenVenta("revisada", "alistada")).toBe(false);
    expect(puedeAvanzarEstadoOrdenVenta("alistamiento", "facturada")).toBe(
      true,
    );
  });
});

describe("formatEstadoOrdenVenta", () => {
  it("usa las etiquetas canónicas del flujo", () => {
    expect(formatEstadoOrdenVenta("por_confirmar")).toBe("Por confirmar");
    expect(formatEstadoOrdenVenta("confirmada")).toBe("Confirmada");
    expect(formatEstadoOrdenVenta("alistamiento")).toBe("Alistamiento");
    expect(formatEstadoOrdenVenta("alistada")).toBe("Alistado");
    expect(formatEstadoOrdenVenta("revisada")).toBe("Revisado");
    expect(formatEstadoOrdenVenta("facturada")).toBe("Facturado");
    expect(formatEstadoOrdenVenta("facturado")).toBe("Facturado");
    expect(formatEstadoOrdenVenta("despachada")).toBe("Despachado");
  });

  it("normaliza legados sin aplastar despacho en alistado", () => {
    expect(formatEstadoOrdenVenta("borrador")).toBe("Por confirmar");
    expect(formatEstadoOrdenVenta("en_preparacion")).toBe("Alistamiento");
    expect(formatEstadoOrdenVenta("parcialmente_despachada")).toBe("Alistado");
    expect(formatEstadoOrdenVenta("despachada")).toBe("Despachado");
    expect(formatEstadoOrdenVenta("embarcada")).toBe("Despachado");
    expect(formatEstadoOrdenVenta("cerrada")).toBe("Despachado");
  });

  it("etiqueta cancelada como Borrada", () => {
    expect(formatEstadoOrdenVenta("cancelada")).toBe("Borrada");
  });
});
