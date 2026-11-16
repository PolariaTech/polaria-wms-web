import { describe, expect, it } from "vitest";
import {
  diaSemanaEntregaEs,
  diaSemanaEntregaEsTitulo,
  formatFechaEntregaConDia,
} from "./dia-semana-entrega";

describe("diaSemanaEntregaEs (REQ-143/257)", () => {
  it("resuelve ISO, DD/MM/AAAA y DD-MMM-AAAA", () => {
    // 2026-11-07 es sábado
    expect(diaSemanaEntregaEs("2026-11-07")).toBe("SÁBADO");
    expect(diaSemanaEntregaEs("07/11/2026")).toBe("SÁBADO");
    expect(diaSemanaEntregaEs("07-NOV-2026")).toBe("SÁBADO");
  });

  it("vacío o inválido → cadena vacía", () => {
    expect(diaSemanaEntregaEs("")).toBe("");
    expect(diaSemanaEntregaEs("no-es-fecha")).toBe("");
  });
});

describe("diaSemanaEntregaEsTitulo (REQ-257)", () => {
  it("capitaliza para el campo de solo lectura", () => {
    expect(diaSemanaEntregaEsTitulo("2026-11-07")).toBe("Sábado");
    expect(diaSemanaEntregaEsTitulo("2026-11-04")).toBe("Miércoles");
  });
});

describe("formatFechaEntregaConDia (REQ-321)", () => {
  it("une fecha y día en un solo valor", () => {
    expect(formatFechaEntregaConDia("2026-11-17")).toBe("17-NOV-2026 (MARTES)");
    expect(formatFechaEntregaConDia("")).toBe("");
  });
});

