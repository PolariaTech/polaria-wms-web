import { describe, expect, it } from "vitest";
import { despachoLocalPuedeEscribirEstado } from "./despacho-publico-local";

const detalle =
  "Nest avanzar-estado-surtido falló (404): Cannot POST /ventas/ordenes/x/avanzar-estado-surtido";

describe("despachoLocalPuedeEscribirEstado", () => {
  it("permite escribir el estado si el API local no tiene la ruta o la llave", () => {
    expect(despachoLocalPuedeEscribirEstado(detalle, "http://127.0.0.1:3000")).toBe(true);
    expect(despachoLocalPuedeEscribirEstado(detalle, "http://localhost:3000")).toBe(true);
    expect(
      despachoLocalPuedeEscribirEstado(
        "INTERNAL_API_KEY no configurada: no se puede avanzar el estado vía Nest.",
        "http://127.0.0.1:3000",
      ),
    ).toBe(true);
  });

  it("no escribe el estado contra el API de producción", () => {
    expect(
      despachoLocalPuedeEscribirEstado(detalle, "https://polaria-wms-api.onrender.com"),
    ).toBe(false);
    expect(
      despachoLocalPuedeEscribirEstado(
        "INTERNAL_API_KEY no configurada: no se puede avanzar el estado vía Nest.",
        "https://polaria-wms-api.onrender.com",
      ),
    ).toBe(false);
  });

  it("no tapa un rechazo de transición ni un 500", () => {
    expect(
      despachoLocalPuedeEscribirEstado(
        "Nest avanzar-estado-surtido falló (409): no permitida",
        "http://127.0.0.1:3000",
      ),
    ).toBe(false);
    expect(
      despachoLocalPuedeEscribirEstado(
        "Nest avanzar-estado-surtido falló (500): error",
        "http://127.0.0.1:3000",
      ),
    ).toBe(false);
  });
});
