import { afterEach, describe, expect, it, vi } from "vitest";
import {
  OPENAI_SURTIDO_VISION_MODEL,
  configModeloSurtido,
  parametrosModeloSurtido,
} from "./surtido-modelo";

describe("configModeloSurtido", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("usa gpt-6.1-terra con esfuerzo low si no hay variable de entorno", () => {
    vi.stubEnv("OPENAI_SURTIDO_MODEL", "");
    expect(OPENAI_SURTIDO_VISION_MODEL).toBe("gpt-6.1-terra");
    expect(configModeloSurtido()).toEqual({
      modelo: "gpt-6.1-terra",
      parametros: { reasoning_effort: "low", max_completion_tokens: 8000 },
    });
  });

  it("OPENAI_SURTIDO_MODEL=gpt-4o revierte al modelo anterior con temperature 0", () => {
    vi.stubEnv("OPENAI_SURTIDO_MODEL", " gpt-4o ");
    expect(configModeloSurtido()).toEqual({
      modelo: "gpt-4o",
      parametros: { temperature: 0 },
    });
  });
});

describe("parametrosModeloSurtido", () => {
  it("para la familia GPT-6 pide esfuerzo low, pone tope de salida y no manda temperature", () => {
    const params = parametrosModeloSurtido("gpt-6.1-terra");
    expect(params).toEqual({
      reasoning_effort: "low",
      max_completion_tokens: 8000,
    });
    expect(params).not.toHaveProperty("temperature");
  });

  it("reconoce otros GPT-6 sin importar mayúsculas ni espacios", () => {
    expect(parametrosModeloSurtido("  GPT-6.1-Sol ")).toHaveProperty(
      "reasoning_effort",
      "low",
    );
  });

  it("si se revierte a gpt-4o conserva temperature 0 y no manda esfuerzo", () => {
    const params = parametrosModeloSurtido("gpt-4o");
    expect(params).toEqual({ temperature: 0 });
    expect(params).not.toHaveProperty("reasoning_effort");
  });
});
