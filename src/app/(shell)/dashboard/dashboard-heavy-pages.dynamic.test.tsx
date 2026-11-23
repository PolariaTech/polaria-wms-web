import { describe, expect, it, vi } from "vitest";

vi.mock("next/dynamic", () => ({
  default: () =>
    function DynamicStub() {
      return null;
    },
}));

describe("dashboard heavy pages (dynamic)", () => {
  it("exporta páginas con carga diferida", async () => {
    const ventas = await import("./(operacion-cuenta)/ventas/page");
    const ordenes = await import("./(operacion-cuenta)/ventas/ordenes/page");
    const mapa = await import("./mapa/page");
    const compras = await import("./(operacion-cuenta)/compras/page");
    const reporteria = await import("./reporteria/page");
    const transporte = await import("./transporte/page");
    const procesamiento = await import("./(operacion-cuenta)/procesamiento/page");
    const jefe = await import("./jefe-bodega/estado-bodega/page");
    const admin = await import("./administrador-bodega/estado-bodega/page");

    expect(typeof ventas.default).toBe("function");
    expect(typeof ordenes.default).toBe("function");
    expect(typeof mapa.default).toBe("function");
    expect(typeof compras.default).toBe("function");
    expect(typeof reporteria.default).toBe("function");
    expect(typeof transporte.default).toBe("function");
    expect(typeof procesamiento.default).toBe("function");
    expect(typeof jefe.default).toBe("function");
    expect(typeof admin.default).toBe("function");
  });
});
