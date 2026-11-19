import { describe, expect, it } from "vitest";
import {
  asegurarNotasGeneralesPedido,
  looksLikePedidoHeaderJunk,
  MSG_NOTAS_SIN_TEXTO_ORIGEN,
  persistirNotasGeneralesDesdeForm,
  sanitizeNotasGeneralesPedido,
} from "./sanitize-notas-generales-pedido";

describe("sanitizeNotasGeneralesPedido", () => {
  it("respeta notas cortas capturadas en Polaria", () => {
    expect(sanitizeNotasGeneralesPedido("Maduro · andén 3")).toBe(
      "Maduro · andén 3",
    );
  });

  it("vacía encabezado ADP (folio/emisión/asesor/cliente) colado como notas", () => {
    const junk =
      "PEDIDO ADP-261116-0520-ARN · ORDINARIO. Emisión: 16/11/2026 05:22 hrs. Asesor: Atención al Cliente. Cliente: PALAPITA ARCO RANCHO VIEJO EVENTO. Teléfono:";
    expect(looksLikePedidoHeaderJunk(junk)).toBe(true);
    expect(sanitizeNotasGeneralesPedido(junk)).toBe("");
  });

  it("REQ-340: conserva nota floja sin señal de madurez/andén", () => {
    expect(sanitizeNotasGeneralesPedido("Favor de confirmar de recibido")).toBe(
      "Favor de confirmar de recibido",
    );
  });

  it("conserva instrucción útil aunque venga junto a metadatos", () => {
    const mixed =
      "Emisión: 16/11/2026. Asesor: Atención al Cliente. Maduro, no verde · andén 3";
    expect(sanitizeNotasGeneralesPedido(mixed)).toMatch(/Maduro/i);
    expect(sanitizeNotasGeneralesPedido(mixed)).toMatch(/andén 3/i);
    expect(sanitizeNotasGeneralesPedido(mixed)).not.toMatch(/Emisi[oó]n/i);
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

describe("asegurarNotasGeneralesPedido (REQ-340)", () => {
  it("si sanitize deja vacío, pone el mensaje de respaldo", () => {
    expect(
      asegurarNotasGeneralesPedido(
        "---------- Forwarded message ----------. De: Daniel Galvis. Date: jue.",
      ),
    ).toBe(MSG_NOTAS_SIN_TEXTO_ORIGEN);
  });

  it("si Mateo trae texto flojo, lo conserva", () => {
    expect(asegurarNotasGeneralesPedido("Confirmar recepción")).toBe(
      "Confirmar recepción",
    );
  });
});

describe("persistirNotasGeneralesDesdeForm (REQ-340)", () => {
  it("conserva el texto del usuario aunque solo queden campos parametrizados al strip", () => {
    expect(persistirNotasGeneralesDesdeForm("Traer dos facturas")).toBe(
      "Traer dos facturas",
    );
  });

  it("si el strip quita todo pero el usuario escribió, conserva el original", () => {
    expect(persistirNotasGeneralesDesdeForm("Andén: 3")).toBe("Andén: 3");
  });

  it("vacío sigue vacío (borrado intencional)", () => {
    expect(persistirNotasGeneralesDesdeForm("   ")).toBe("");
  });
});
