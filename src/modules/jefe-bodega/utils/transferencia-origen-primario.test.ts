import { describe, expect, it } from "vitest";
import { resolveUbicacionOrigenPrimarioDesdeOt } from "./transferencia-origen-primario";

describe("resolveUbicacionOrigenPrimarioDesdeOt", () => {
  it("usa el origen de la OT a_procesamiento", () => {
    const id = resolveUbicacionOrigenPrimarioDesdeOt({
      idUbicacionProcesamiento: "u-proc",
      idSolicitud: "sol-1",
      idProductoPrimario: "prod-a",
      ordenes: [
        {
          idOrdenTrabajo: "ot-1",
          tipoFlujo: "a_procesamiento",
          idUbicacionDestino: "u-proc",
          idUbicacionOrigen: "u-alm-2",
          observaciones: "solicitudProcesamiento:sol-1",
        } as never,
      ],
      almacenIds: new Set(["u-alm-2", "u-alm-3"]),
      warehouseRows: [],
    });

    expect(id).toBe("u-alm-2");
  });

  it("fallback a stock del primario en almacenamiento", () => {
    const id = resolveUbicacionOrigenPrimarioDesdeOt({
      idUbicacionProcesamiento: "u-proc",
      idSolicitud: null,
      idProductoPrimario: "prod-a",
      ordenes: [],
      almacenIds: new Set(["u-alm-2"]),
      warehouseRows: [
        {
          id_ubicacion: "u-alm-2",
          id_producto: "prod-a",
          cantidad: "0",
        } as never,
      ],
    });

    expect(id).toBe("u-alm-2");
  });
});
