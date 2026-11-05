import type OpenAI from "openai";

/**
 * Modelo por defecto para leer la hoja de surtido (evaluación del 2026-11-04,
 * 20 fotos reales: más exacto en chulos, sin inventar cantidades y ~39 % más
 * barato que gpt-4o). Se cambia con OPENAI_SURTIDO_MODEL sin desplegar código.
 */
export const OPENAI_SURTIDO_VISION_MODEL = "gpt-6.1-terra";

/** Tope de tokens de salida: lo observado fue de 800 a 1.800 con el razonamiento incluido. */
const TOPE_TOKENS_SALIDA = 8000;

type ParametrosModelo = Pick<
  OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming,
  "temperature" | "reasoning_effort" | "max_completion_tokens"
>;

/** Modelo (OPENAI_SURTIDO_MODEL o el de por defecto) y los parámetros que le corresponden. */
export function configModeloSurtido(): {
  modelo: string;
  parametros: ParametrosModelo;
} {
  const modelo =
    process.env.OPENAI_SURTIDO_MODEL?.trim() || OPENAI_SURTIDO_VISION_MODEL;
  return { modelo, parametros: parametrosModeloSurtido(modelo) };
}

/**
 * La familia GPT-6 no usa `temperature`: se controla con `reasoning_effort`
 * (`low` repitió mejor los chulos de Revisó que `none`). Cualquier otro modelo,
 * por ejemplo gpt-4o si se revierte con la variable de entorno, conserva `temperature: 0`.
 */
export function parametrosModeloSurtido(modelo: string): ParametrosModelo {
  if (modelo.trim().toLowerCase().startsWith("gpt-6")) {
    return {
      reasoning_effort: "low",
      max_completion_tokens: TOPE_TOKENS_SALIDA,
    };
  }
  return { temperature: 0 };
}
