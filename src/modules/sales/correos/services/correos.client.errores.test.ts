import { errorDeRespuesta, inesperada } from "./correos.client.errores";

describe("correos.client.errores", () => {
  it("mapea CORREOS_NO_DISPONIBLES a cuenta no habilitada", () => {
    const error = errorDeRespuesta(403, {
      error: "CORREOS_NO_DISPONIBLES",
      message: "x",
    });
    expect(error.codigo).toBe("CUENTA_NO_HABILITADA");
  });

  it("inesperada usa RESPUESTA_INESPERADA", () => {
    expect(inesperada().codigo).toBe("RESPUESTA_INESPERADA");
  });
});
