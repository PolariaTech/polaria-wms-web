import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  completarTareaOperario,
  isTareaPostCierreRetorno,
  isTareaProcesamientoMovimiento,
} from "./operario-completar-tarea.service";

const iniciarProcesamiento = vi.fn();
const aplicarOrdenProcesamiento = vi.fn();
const completarTareaColaApi = vi.fn();

vi.mock("@/modules/processing", () => ({
  iniciarProcesamiento: (...args: unknown[]) => iniciarProcesamiento(...args),
  aplicarOrdenProcesamiento: (...args: unknown[]) =>
    aplicarOrdenProcesamiento(...args),
}));

vi.mock("@/modules/operations", () => ({
  completarTareaColaApi: (...args: unknown[]) => completarTareaColaApi(...args),
}));

describe("operario-completar-tarea", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("detecta tareas de procesamiento", () => {
    expect(
      isTareaProcesamientoMovimiento({
        tipo: "procesamiento",
        tipoFlujo: null,
      } as never),
    ).toBe(true);
    expect(
      isTareaProcesamientoMovimiento({
        tipo: "movimiento",
        tipoFlujo: "a_procesamiento",
      } as never),
    ).toBe(true);
  });

  it("inicia procesamiento antes de completar tarea", async () => {
    iniciarProcesamiento.mockResolvedValue({});
    completarTareaColaApi.mockResolvedValue({});

    await completarTareaOperario({
      tarea: {
        id_tarea: "t-1",
        tipo: "procesamiento",
        tipoFlujo: null,
        id_solicitud_procesamiento: "sol-1",
      } as never,
      codigoCuenta: "cuenta",
      idBodega: "bodega",
    });

    expect(iniciarProcesamiento).toHaveBeenCalledWith("sol-1", {
      codigoCuenta: "cuenta",
      idBodega: "bodega",
    });
    expect(completarTareaColaApi).toHaveBeenCalledWith("t-1", {
      codigoCuenta: "cuenta",
      idBodega: "bodega",
    });
  });

  it("detecta tareas post-cierre por rolDevolucion", () => {
    expect(
      isTareaPostCierreRetorno({
        id_solicitud_procesamiento: "sol-1",
        ordenObservaciones: "rolDevolucion:procesado",
      } as never),
    ).toBe(true);
    expect(
      isTareaProcesamientoMovimiento({
        tipo: "movimiento",
        tipoFlujo: "a_procesamiento",
        ordenObservaciones: "rolDevolucion:procesado",
        id_solicitud_procesamiento: "sol-1",
      } as never),
    ).toBe(false);
  });

  it("aplica orden post-cierre antes de completar tarea", async () => {
    aplicarOrdenProcesamiento.mockResolvedValue({ ok: true });
    completarTareaColaApi.mockResolvedValue({});

    await completarTareaOperario({
      tarea: {
        id_tarea: "t-2",
        id_orden_trabajo: "ord-post",
        id_solicitud_procesamiento: "sol-1",
        tipo: "movimiento",
        ordenObservaciones: "rolDevolucion:desperdicio",
      } as never,
      codigoCuenta: "cuenta",
      idBodega: "bodega",
    });

    expect(aplicarOrdenProcesamiento).toHaveBeenCalledWith("sol-1", "ord-post");
    expect(iniciarProcesamiento).not.toHaveBeenCalled();
    expect(completarTareaColaApi).toHaveBeenCalledWith("t-2", {
      codigoCuenta: "cuenta",
      idBodega: "bodega",
    });
  });
});
