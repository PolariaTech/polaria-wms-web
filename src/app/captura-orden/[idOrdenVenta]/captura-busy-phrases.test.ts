import { describe, expect, it } from "vitest";
import {
  CAPTURA_BUSY_PHRASES,
  CAPTURA_BUSY_PHRASE_MS,
  CAPTURA_DONE_PHRASE,
  ESPERA_LEER_HOJA,
} from "./captura-busy-phrases";

describe("captura-busy-phrases", () => {
  it("las frases describen la lectura, no la subida (la foto ya está recibida)", () => {
    expect(CAPTURA_BUSY_PHRASES.length).toBeGreaterThan(1);
    for (const frase of CAPTURA_BUSY_PHRASES) {
      expect(frase).not.toMatch(/subiendo|preparando la foto|iniciando/i);
    }
    expect(CAPTURA_BUSY_PHRASES[0]).toMatch(/leyendo la hoja/i);
  });

  it("el rango de espera es coherente y la frase final es «Listo»", () => {
    expect(ESPERA_LEER_HOJA.minSeg).toBeGreaterThan(0);
    expect(ESPERA_LEER_HOJA.maxSeg).toBeGreaterThan(ESPERA_LEER_HOJA.minSeg);
    expect(CAPTURA_DONE_PHRASE).toBe("Listo");
    expect(CAPTURA_BUSY_PHRASE_MS).toBeGreaterThanOrEqual(1000);
  });
});
