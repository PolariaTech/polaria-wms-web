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
});
