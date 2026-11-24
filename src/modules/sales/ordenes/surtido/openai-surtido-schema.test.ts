import { describe, expect, it } from "vitest";
import {
  CABECERA_KEYS,
  CABECERA_LABELS,
  CHECK_KEYS,
  SURTIDO_SCHEMA,
} from "./openai-surtido-schema";

describe("openai-surtido-schema", () => {
  it("tiene etiquetas para cada cabecera", () => {
    for (const key of CABECERA_KEYS) {
      expect(CABECERA_LABELS[key]).toBeTruthy();
    }
  });

  it("schema exige calidadFoto y lineas", () => {
    expect(SURTIDO_SCHEMA.required).toContain("calidadFoto");
    expect(SURTIDO_SCHEMA.required).toContain("lineas");
    expect(CHECK_KEYS.length).toBeGreaterThan(5);
  });
});