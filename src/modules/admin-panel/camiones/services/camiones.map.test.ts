import { describe, expect, it } from "vitest";
import { formatCamionId, mapCamionRow, parseDecimal } from "./camiones.map";
import type { CamionDbRow } from "./camiones.types";

describe("camiones.map", () => {
  it("parseDecimal convierte valores válidos y descarta vacíos", () => {
    expect(parseDecimal("12.5")).toBe(12.5);
    expect(parseDecimal(7)).toBe(7);
    expect(parseDecimal("")).toBeNull();
    expect(parseDecimal(null)).toBeNull();
    expect(parseDecimal("abc")).toBeNull();
  });

  it("formatCamionId toma 8 caracteres en mayúscula", () => {
    expect(formatCamionId("abcdef12-3456")).toBe("ABCDEF12");
  });

  it("mapCamionRow mapea columnas y aplica valores por defecto", () => {
    const mapped = mapCamionRow({
      id_camion: "id1",
      codigo: null,
      placa: "ABC123",
      marca: "Hino",
      modelo: "500",
      tipo: "seco",
      capacidad_kg: "1500.5",
      capacidad_m3: null,
      capacidad_pallets: 8,
      rango_temperatura: null,
      disponible: true,
      esta_activo: null,
      created_at: "2026-01-01",
    } as unknown as CamionDbRow);

    expect(mapped.codigo).toBe("—");
    expect(mapped.capacidadKg).toBe(1500.5);
    expect(mapped.capacidadM3).toBeNull();
    expect(mapped.estaActivo).toBe(true);
  });
});
