import { describe, expect, it } from "vitest";
import { sanitizeNotasGeneralesPedido } from "./sanitize-notas-generales-pedido";

describe("sanitizeNotasGeneralesPedido", () => {
  it("respeta notas cortas capturadas en Polaria", () => {
    expect(sanitizeNotasGeneralesPedido("Maduro · andén 3")).toBe(
      "Maduro · andén 3",
    );
  });

  it("REQ-286: no inventa Entrega/Destino a partir del cuerpo del correo", () => {
    const junk =
      "---------- Forwarded message ----------. De: Daniel Galvis. Date: jue, 1 oct 2026 a la(s) 9:53 a.m.. AGOSTO DE 2026. ---------------------------. *De:*";
    const origen = [
      "Buenas tardes,",
      "Envío adjunto pedido para entregar el 27 DE AGOSTO DE 2026 en Parque Xcaret:",
      "Hora de entrega 6:00 am",
      "Favor de confirmar de recibido",
      "Nancy Guadalupe Pérez Cruz",
    ].join("\n");
    const notes = sanitizeNotasGeneralesPedido(junk, origen);
    expect(notes).not.toContain("Forwarded message");
    expect(notes).not.toContain("Daniel Galvis");
    expect(notes).not.toMatch(/Entrega 27 DE AGOSTO/i);
    expect(notes).not.toMatch(/Destino:\s*Parque Xcaret/i);
  });

  it("si solo hay basura de forward sin cuerpo, deja vacío", () => {
    expect(
      sanitizeNotasGeneralesPedido(
        "---------- Forwarded message ----------. De: Daniel Galvis. Date: jue.",
      ),
    ).toBe("");
  });

  it("REQ-277: quita líneas que repiten campos ya parametrizados", () => {
    const notes = sanitizeNotasGeneralesPedido(
      [
        "Fecha de entrega: 06/11/2026",
        "Maduro, no verde",
        "Prioridad: Alta",
        "Andén: 3",
        "Entregar por rampa lateral",
      ].join("\n"),
    );
    expect(notes).toBe("Maduro, no verde\nEntregar por rampa lateral");
    expect(notes).not.toMatch(/Fecha de entrega/i);
    expect(notes).not.toMatch(/Prioridad/i);
    expect(notes).not.toMatch(/^Andén:/m);
  });
});
