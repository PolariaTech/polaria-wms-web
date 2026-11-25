import { describe, expect, it } from "vitest";
import {
  appendUniqueBlockSurtido,
  parseCantidadPreparadaKg,
  parseFechaManuscritaToIso,
} from "./sync-surtido-parsers";

describe("parseCantidadPreparadaKg", () => {
  it("lee números con unidad", () => {
    expect(parseCantidadPreparadaKg("5 kg")).toBe(5);
    expect(parseCantidadPreparadaKg("12,5 kilos")).toBe(12.5);
    expect(parseCantidadPreparadaKg("3")).toBe(3);
  });

  it("devuelve null si no hay número", () => {
    expect(parseCantidadPreparadaKg("")).toBeNull();
    expect(parseCantidadPreparadaKg("n/a")).toBeNull();
  });
});

describe("parseFechaManuscritaToIso", () => {
  it("acepta ISO y DD/MM/YYYY", () => {
    expect(parseFechaManuscritaToIso("2026-09-14")).toBe("2026-09-14");
    expect(parseFechaManuscritaToIso("08/09/2026")).toBe("2026-09-08");
    expect(parseFechaManuscritaToIso("8-9-26")).toBe("2026-09-08");
  });

  it("devuelve null si no es fecha", () => {
    expect(parseFechaManuscritaToIso("5PM")).toBeNull();
    expect(parseFechaManuscritaToIso("")).toBeNull();
  });
});

describe("appendUniqueBlockSurtido", () => {
  it("no duplica bloques ya presentes", () => {
    expect(appendUniqueBlockSurtido("hola", "hola")).toBe("hola");
    expect(appendUniqueBlockSurtido("a", "b")).toBe("a\n\nb");
  });
});