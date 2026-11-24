import { describe, expect, it } from "vitest";
import {
  formatIso,
  normalizarHoraAHhMm,
  parseFechaConMesNombre,
  parseFechaNumerica,
} from "./extract-entrega-desde-texto-fechas";

describe("extract-entrega-desde-texto-fechas", () => {
  it("formatea fechas UTC a YYYY-MM-DD", () => {
    expect(formatIso(new Date(Date.UTC(2026, 9, 5, 12, 0, 0)))).toBe(
      "2026-10-05",
    );
  });

  it("normaliza horas en formato 12h y 24h a HH:MM", () => {
    expect(normalizarHoraAHhMm("6", "30", "am")).toBe("06:30");
    expect(normalizarHoraAHhMm("12", "00", "a.m.")).toBe("00:00");
    expect(normalizarHoraAHhMm("2", "15", "p.m.")).toBe("14:15");
    expect(normalizarHoraAHhMm("24", "00", undefined)).toBe("00:00");
    expect(normalizarHoraAHhMm("25", "00", undefined)).toBeNull();
    expect(normalizarHoraAHhMm("10", "65", undefined)).toBeNull();
  });

  it("parsea fechas numéricas ISO, DMY LatAm y MDY US", () => {
    expect(parseFechaNumerica("2026-10-23")).toBe("2026-10-23");
    expect(parseFechaNumerica("23/10/2026")).toBe("2026-10-23");
    expect(parseFechaNumerica("10/23/2026")).toBe("2026-10-23");
    expect(parseFechaNumerica("05/04/26")).toBe("2026-04-05");
    expect(parseFechaNumerica("31/02/2026")).toBeNull();
  });

  it("parsea fechas con nombre de mes en español e inglés con y sin año", () => {
    expect(parseFechaConMesNombre("23 de octubre de 2026", "2026-10-01")).toBe(
      "2026-10-23",
    );
    expect(parseFechaConMesNombre("5 de noviembre", "2026-10-01")).toBe(
      "2026-11-05",
    );
    expect(parseFechaConMesNombre("12 de December 2026", "2026-10-01")).toBe(
      "2026-12-12",
    );
    expect(parseFechaConMesNombre("sin fecha", "2026-10-01")).toBeNull();
  });
});
