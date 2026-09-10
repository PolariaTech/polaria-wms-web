import { describe, expect, it } from "vitest";
import {
  aplicarEmpaqueInicialLinea,
  collectMissingFieldsDocs,
  recalcularCajasPorPresentacion,
  recalcularPorCajas,
  sugerirEmpaqueDesdeCantidad,
} from "./empaque-lineas";

describe("empaque-lineas", () => {
  it("con cajas sin presentación asume Caja 1.5 kg y recalcula cantidad", () => {
    const result = recalcularPorCajas({
      cajasInput: "10",
      presentacion: "",
      cantidadInput: "",
    });
    expect(result.presentacion).toBe("Caja 1.5 kg");
    expect(result.cantidadInput).toBe("15");
    expect(result.autoPackFields).toContain("presentacion");
    expect(result.autoPackFields).toContain("cantidadInput");
  });

  it("sugiere 2 cajas de 20 kg para 40 kg exactos", () => {
    const result = sugerirEmpaqueDesdeCantidad({
      cajasInput: "",
      presentacion: "",
      cantidadInput: "40",
    });
    expect(result.presentacion).toBe("Caja 20 kg");
    expect(result.cajasInput).toBe("2");
    expect(result.packHint).toBe("");
  });

  it("para 25 kg sugiere empaque aproximado con hint", () => {
    const result = sugerirEmpaqueDesdeCantidad({
      cajasInput: "",
      presentacion: "",
      cantidadInput: "25",
    });
    expect(Number(result.cajasInput)).toBeGreaterThan(0);
    expect(result.presentacion).toMatch(/^Caja /);
    expect(result.packHint).toContain("Aproximado");
  });

  it("al cambiar presentación con cantidad fija recalcula cajas", () => {
    const result = recalcularCajasPorPresentacion({
      cajasInput: "17",
      presentacion: "Caja 20 kg",
      cantidadInput: "25",
    });
    expect(result.cajasInput).toBe("2");
    expect(result.packHint).toContain("Aproximado");
  });

  it("Granel limpia cajas", () => {
    const result = recalcularCajasPorPresentacion({
      cajasInput: "10",
      presentacion: "Granel",
      cantidadInput: "15",
    });
    expect(result.cajasInput).toBe("");
    expect(result.packHint).toBe("");
  });

  it("aplicarEmpaqueInicialLinea con cajas aplica default 1.5 kg", () => {
    const result = aplicarEmpaqueInicialLinea({
      cajasInput: "4",
      presentacion: "",
      cantidadInput: "",
    });
    expect(result.presentacion).toBe("Caja 1.5 kg");
    expect(result.cantidadInput).toBe("6");
  });

  it("collectMissingFieldsDocs marca vacíos operativos", () => {
    const missing = collectMissingFieldsDocs({
      fechaEntrega: "2026-09-10",
      centroConsumo: "",
      direccion: "Calle 1",
      anden: "",
      contacto: "Ana",
      telefono: "",
      ventanaDesde: "06:00",
      ventanaHasta: "",
    });
    expect(missing.has("centroConsumo")).toBe(true);
    expect(missing.has("anden")).toBe(true);
    expect(missing.has("telefono")).toBe(true);
    expect(missing.has("ventanaHasta")).toBe(true);
    expect(missing.has("fechaEntrega")).toBe(false);
    expect(missing.has("direccion")).toBe(false);
  });
});
