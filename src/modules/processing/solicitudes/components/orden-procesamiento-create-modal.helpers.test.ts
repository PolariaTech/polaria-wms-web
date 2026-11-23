import { describe, expect, it } from "vitest";
import {
  formatBodegaLabel,
  formatDisplayDate,
  formatTodayInputValue,
  parsePositiveNumber,
} from "./orden-procesamiento-create-modal.helpers";
import type { BodegaInternaVinculadaRow } from "@/modules/admin-panel";

describe("orden-procesamiento-create-modal.helpers", () => {
  it("formatea fechas ISO a dd/mm/yyyy y respeta entradas inválidas", () => {
    expect(formatDisplayDate("2026-11-22")).toBe("22/11/2026");
    expect(formatDisplayDate("no-fecha")).toBe("no-fecha");
  });

  it("formatea hoy como yyyy-mm-dd", () => {
    expect(formatTodayInputValue()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("parsea números positivos con coma decimal", () => {
    expect(parsePositiveNumber("1,5")).toBe(1.5);
    expect(parsePositiveNumber("0")).toBeNull();
    expect(parsePositiveNumber("abc")).toBeNull();
  });

  it("arma la etiqueta de bodega", () => {
    expect(
      formatBodegaLabel({ nombre: "Mapa 1", codigo: "M1" } as unknown as BodegaInternaVinculadaRow),
    ).toBe("Mapa 1 (M1)");
  });
});
