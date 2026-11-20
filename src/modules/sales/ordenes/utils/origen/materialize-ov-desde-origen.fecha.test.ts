import { describe, expect, it } from "vitest";
import {
  parseFechaOrigen,
  resolveFechaEntregaDesdeOrigen,
} from "./parse-origen-renglon";

describe("fechas de materialize-ov-desde-origen", () => {
  it("parsea fechas del tercero", () => {
    expect(parseFechaOrigen("2026-09-10")).toBe("2026-09-10");
    expect(parseFechaOrigen("2026-10-06 16:01:52")).toBe("2026-10-06");
  });

  it("resuelve MM/DD BirchStreet sin inventar mes 24", () => {
    expect(parseFechaOrigen("10/24/2026")).toBe("2026-10-24");
    expect(parseFechaOrigen("Delivery date: 10/24/2026")).toBe("2026-10-24");
    expect(parseFechaOrigen("FECHA DE ENTREGA : 10/26/2026")).toBe(
      "2026-10-26",
    );
    expect(parseFechaOrigen("21/10/2026")).toBe("2026-10-21");
    expect(parseFechaOrigen("10/05/2026")).toBe("2026-05-10");
  });

  it("resolveFechaEntregaDesdeOrigen prioriza OT y luego Fecha del origen (REQ-110)", () => {
    expect(
      resolveFechaEntregaDesdeOrigen({
        origenCorreo: [
          {
            Fecha: "10/26/2026",
            Producto: "X",
            Cantidad: 1,
          } as never,
        ],
        hijas: [],
      }),
    ).toBe("2026-10-26");
    expect(
      resolveFechaEntregaDesdeOrigen({
        origenCorreo: [
          {
            Fecha: "10/26/2026",
            Producto: "X",
            Cantidad: 1,
          } as never,
        ],
        hijas: [{ fecha: "2026-10-28" }],
      }),
    ).toBe("2026-10-28");
    expect(
      resolveFechaEntregaDesdeOrigen({
        origenCorreo: [
          { Fecha: "", Producto: "X", Cantidad: 1 } as never,
        ],
        hijas: [],
      }),
    ).toBeNull();
  });
});
