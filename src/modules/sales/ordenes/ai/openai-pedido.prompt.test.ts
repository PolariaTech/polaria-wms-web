import { describe, expect, it } from "vitest";
import { buildSystemPromptPedido } from "./openai-pedido.prompt";

describe("buildSystemPromptPedido (REQ-311)", () => {
  it("exige no omitir filas fuera de catálogo y no mapear pimiento a pulpa", () => {
    const prompt = buildSystemPromptPedido([], []);
    expect(prompt).toMatch(/fuera de catálogo/i);
    expect(prompt).toMatch(/productoCatalogo null/i);
    expect(prompt).toMatch(/pimiento.*pulpa|pulpa.*pimiento/i);
    expect(prompt).toMatch(/colores/i);
  });

  it("exige conservar el orden de productos del documento (REQ-370)", () => {
    const prompt = buildSystemPromptPedido([], []);
    expect(prompt).toMatch(/ORDEN de "lineas"/i);
    expect(prompt).toMatch(/arriba hacia abajo/i);
    expect(prompt).toMatch(/Prohibido reordenar/i);
    expect(prompt).toMatch(/cuerpoMensaje tipo=tabla/i);
  });
});
