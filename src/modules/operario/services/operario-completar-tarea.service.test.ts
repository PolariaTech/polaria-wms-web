import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  completarTareaOperario,
  isTareaPostCierreRetorno,
  isTareaProcesamientoMovimiento,
} from "./operario-completar-tarea.service";

const iniciarProcesamiento = vi.fn();
const aplicarOrdenProcesamiento = vi.fn();
const completarTareaColaApi = vi.fn();
const listWarehouseState = vi.fn();
const lockWarehouseStateApi = vi.fn();
const unlockWarehouseStateApi = vi.fn();

vi.mock("@/modules/processing", () => ({
  iniciarProcesamiento: (...args: unknown[]) => iniciarProcesamiento(...args),
  aplicarOrdenProcesamiento: (...args: unknown[]) =>
    aplicarOrdenProcesamiento(...args),
}));

vi.mock("@/modules/operations", () => ({
  completarTareaColaApi: (...args: unknown[]) => completarTareaColaApi(...args),
}));

vi.mock("@/modules/inventory", () => ({
  listWarehouseState: (...args: unknown[]) => listWarehouseState(...args),
  lockWarehouseStateApi: (...args: unknown[]) => lockWarehouseStateApi(...args),
  unlockWarehouseStateApi: (...args: unknown[]) =>
    unlockWarehouseStateApi(...args),
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
        idUbicacionOrigen: null,
        idLoteOrden: null,
      } as never,
      codigoCuenta: "cuenta",
      idBodega: "bodega",
    });

    expect(listWarehouseState).not.toHaveBeenCalled();
    expect(iniciarProcesamiento).toHaveBeenCalledWith("sol-1", {
      codigoCuenta: "cuenta",
      idBodega: "bodega",
    });
    expect(completarTareaColaApi).toHaveBeenCalledWith("t-1", {
      codigoCuenta: "cuenta",
      idBodega: "bodega",
    });
  });

  it("bloquea origen antes de completar movimiento interno", async () => {
    listWarehouseState.mockResolvedValue([
      {
        id_warehouse_state: "ws-1",
        cantidad: "5",
        id_lote: "lote-1",
        version: 3,
      },
    ]);
    lockWarehouseStateApi.mockResolvedValue({});
    unlockWarehouseStateApi.mockResolvedValue({});
    completarTareaColaApi.mockResolvedValue({});

    await completarTareaOperario({
      tarea: {
        id_tarea: "t-bb",
        id_orden_trabajo: "ord-bb",
        tipo: "movimiento",
        tipoFlujo: "bodega_a_bodega",
        idUbicacionOrigen: "ubi-proc",
        idLoteOrden: "lote-1",
      } as never,
      codigoCuenta: "cuenta",
      idBodega: "bodega",
    });

    expect(listWarehouseState).toHaveBeenCalledWith({
      idBodega: "bodega",
      codigoCuenta: "cuenta",
      idUbicacion: "ubi-proc",
    });
    expect(lockWarehouseStateApi).toHaveBeenCalledWith("ws-1", {
      codigoCuenta: "cuenta",
      idBodega: "bodega",
      expectedVersion: 3,
    });
    expect(completarTareaColaApi).toHaveBeenCalledWith("t-bb", {
      codigoCuenta: "cuenta",
      idBodega: "bodega",
    });
    expect(unlockWarehouseStateApi).toHaveBeenCalledWith("ws-1", {
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

  it("aplica orden post-cierre de resultado y no transfiere desde origen", async () => {
    aplicarOrdenProcesamiento.mockResolvedValue({ ok: true });

    await completarTareaOperario({
      tarea: {
        id_tarea: "t-res",
        id_orden_trabajo: "ord-res",
        id_solicitud_procesamiento: "sol-1",
        tipo: "movimiento",
        tipoFlujo: "bodega_a_bodega",
        idUbicacionOrigen: "ubi-proc",
        idLoteOrden: null,
        ordenObservaciones:
          "flujo:bodega_a_bodega|rolDevolucion:procesado|solicitudProcesamiento:sol-1",
      } as never,
      codigoCuenta: "cuenta",
      idBodega: "bodega",
    });

    expect(listWarehouseState).not.toHaveBeenCalled();
    expect(aplicarOrdenProcesamiento).toHaveBeenCalledWith("sol-1", "ord-res");
    expect(completarTareaColaApi).not.toHaveBeenCalled();
  });

  it("aplica orden post-cierre de sobrante no: mueve con completar", async () => {
    listWarehouseState.mockResolvedValue([
      {
        id_warehouse_state: "ws-1",
        cantidad: "2",
        id_lote: null,
        version: 1,
      },
    ]);
    lockWarehouseStateApi.mockResolvedValue({});
    unlockWarehouseStateApi.mockResolvedValue({});
    completarTareaColaApi.mockResolvedValue({});

    await completarTareaOperario({
      tarea: {
        id_tarea: "t-2",
        id_orden_trabajo: "ord-post",
        id_solicitud_procesamiento: "sol-1",
        tipo: "movimiento",
        tipoFlujo: "bodega_a_bodega",
        idUbicacionOrigen: "ubi-proc",
        idLoteOrden: null,
        ordenObservaciones: "rolDevolucion:desperdicio|solicitudProcesamiento:sol-1",
      } as never,
      codigoCuenta: "cuenta",
      idBodega: "bodega",
    });

    expect(aplicarOrdenProcesamiento).not.toHaveBeenCalled();
    expect(iniciarProcesamiento).not.toHaveBeenCalled();
    expect(completarTareaColaApi).toHaveBeenCalledWith("t-2", {
      codigoCuenta: "cuenta",
      idBodega: "bodega",
    });
  });
});
