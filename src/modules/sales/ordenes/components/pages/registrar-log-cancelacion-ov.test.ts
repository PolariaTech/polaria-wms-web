import { beforeEach, describe, expect, it, vi } from "vitest";

const postOrdenVentaLog = vi.hoisted(() => vi.fn());

vi.mock("../../services/orden-venta-log.client", () => ({
  postOrdenVentaLog,
}));

import { registrarLogCancelacionOv } from "./registrar-log-cancelacion-ov";

describe("registrarLogCancelacionOv", () => {
  beforeEach(() => {
    postOrdenVentaLog.mockReset();
    postOrdenVentaLog.mockResolvedValue(undefined);
  });

  it("envía el log de cancelación", () => {
    registrarLogCancelacionOv({
      idOrdenVenta: "ov-1",
      codigoCuenta: "mit",
      autor: "Lucho",
      idUsuario: "u-1",
      autorNombre: "Lucho",
      idBodega: "b-1",
    });
    expect(postOrdenVentaLog).toHaveBeenCalledWith(
      expect.objectContaining({
        idOrdenVenta: "ov-1",
        mensaje: "Orden cancelada por Lucho.",
      }),
    );
  });

  it("no propaga rechazo del log", async () => {
    postOrdenVentaLog.mockRejectedValueOnce(new Error("red"));
    expect(() =>
      registrarLogCancelacionOv({
        idOrdenVenta: "ov-1",
        codigoCuenta: "mit",
        autor: "Lucho",
        idUsuario: null,
        autorNombre: null,
        idBodega: null,
      }),
    ).not.toThrow();
    await Promise.resolve();
  });
});
