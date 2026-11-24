import { describe, expect, it } from "vitest";
import { errorDeRespuesta } from "./correccion-correo.client.http";

describe("errorDeRespuesta", () => {
  it.each([
    [401, {}, "SESION"],
    [403, {}, "SIN_PERMISO"],
    [404, { error: "TRABAJO_NO_ENCONTRADO" }, "TRABAJO_PERDIDO"],
    [404, {}, "NO_ENCONTRADA"],
    [400, {}, "SOLICITUD_INVALIDA"],
    [422, { error: "RELECTURA_NO_CUADRA" }, "RELECTURA_NO_CUADRA"],
  ] as const)("HTTP %s → %s", (status, cuerpo, codigo) => {
    expect(errorDeRespuesta(status, cuerpo).codigo).toBe(codigo);
  });
});