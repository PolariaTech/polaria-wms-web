import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  ingresarCorreo: vi.fn(),
  consultarIngreso: vi.fn(),
}));

vi.mock("../services/correos.client", async (importarOriginal) => ({
  ...(await importarOriginal<typeof import("../services/correos.client")>()),
  ...api,
}));

import {
  ERROR_INGRESO_LENTO,
  esperarResultadoIngreso,
} from "./esperar-resultado-ingreso";

describe("esperarResultadoIngreso", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("devuelve al instante si el POST ya trae error", async () => {
    api.ingresarCorreo.mockResolvedValue({
      messageId: "m1",
      estado: "error",
      idOrdenVenta: null,
      codigoOrdenVenta: null,
      error: "sin renglones",
    });

    await expect(esperarResultadoIngreso("m1")).resolves.toMatchObject({
      estado: "error",
      error: "sin renglones",
    });
    expect(api.consultarIngreso).not.toHaveBeenCalled();
  });

  it("sondea hasta ingresado cuando el POST queda procesando", async () => {
    api.ingresarCorreo.mockResolvedValue({
      messageId: "m2",
      estado: "procesando",
      idOrdenVenta: null,
      codigoOrdenVenta: null,
      error: null,
    });
    api.consultarIngreso
      .mockResolvedValueOnce({
        messageId: "m2",
        estado: "procesando",
        idOrdenVenta: null,
        codigoOrdenVenta: null,
        error: null,
      })
      .mockResolvedValueOnce({
        messageId: "m2",
        estado: "ingresado",
        idOrdenVenta: "ov",
        codigoOrdenVenta: "OV-1",
        error: null,
      });

    const promesa = esperarResultadoIngreso("m2");
    await vi.advanceTimersByTimeAsync(3_000);
    await vi.advanceTimersByTimeAsync(3_000);
    await expect(promesa).resolves.toMatchObject({
      estado: "ingresado",
      codigoOrdenVenta: "OV-1",
    });
  });

  it("corta con error si el worker sigue en procesando más de 90 s", async () => {
    api.ingresarCorreo.mockResolvedValue({
      messageId: "m3",
      estado: "procesando",
      idOrdenVenta: null,
      codigoOrdenVenta: null,
      error: null,
    });
    api.consultarIngreso.mockResolvedValue({
      messageId: "m3",
      estado: "procesando",
      idOrdenVenta: null,
      codigoOrdenVenta: null,
      error: null,
    });

    const promesa = esperarResultadoIngreso("m3");
    await vi.advanceTimersByTimeAsync(90_000);
    await expect(promesa).resolves.toMatchObject({
      estado: "error",
      error: ERROR_INGRESO_LENTO,
    });
  });

  it("sigue sondeando si un GET falla de forma pasajera", async () => {
    api.ingresarCorreo.mockResolvedValue({
      messageId: "m4",
      estado: "procesando",
      idOrdenVenta: null,
      codigoOrdenVenta: null,
      error: null,
    });
    api.consultarIngreso
      .mockRejectedValueOnce(new Error("red caida"))
      .mockResolvedValueOnce({
        messageId: "m4",
        estado: "ingresado",
        idOrdenVenta: "ov",
        codigoOrdenVenta: "OV-4",
        error: null,
      });

    const promesa = esperarResultadoIngreso("m4");
    await vi.advanceTimersByTimeAsync(3_000);
    await vi.advanceTimersByTimeAsync(3_000);
    await expect(promesa).resolves.toMatchObject({
      estado: "ingresado",
      codigoOrdenVenta: "OV-4",
    });
  });
});
