import { describe, expect, it } from "vitest";
import {
  CorreccionCorreoApiError,
  ESPERA_MAXIMA_MS,
  INTERVALO_CONSULTA_MS,
  interpretarInstruccion,
  solicitarCorreccionCorreo,
} from "./correccion-correo.client";

describe("correccion-correo.client (barrel)", () => {
  it("reexporta API pública", () => {
    expect(CorreccionCorreoApiError).toBeDefined();
    expect(interpretarInstruccion).toBeTypeOf("function");
    expect(solicitarCorreccionCorreo).toBeTypeOf("function");
    expect(INTERVALO_CONSULTA_MS).toBe(3000);
    expect(ESPERA_MAXIMA_MS).toBe(6 * 60 * 1000);
  });
});