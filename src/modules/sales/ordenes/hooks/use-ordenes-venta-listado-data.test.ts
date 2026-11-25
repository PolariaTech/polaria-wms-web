import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  INTERVALO_RECARGA_LISTADO_MS,
  useOrdenesVentaListadoData,
} from "./use-ordenes-venta-listado-data";

const listarOv = vi.fn();
const getOvById = vi.fn();
const idsFotos = vi.fn();
const idsCorreo = vi.fn();
let alCambiar:
  | ((payload: import("../../shared/hooks/ordenes-venta-realtime.types").OrdenVentaRealtimePostgresPayload) => void)
  | undefined;
const intervalo = vi.fn();

vi.mock("../../shared/services/sales.service", () => ({
  listOrdenesVentaOperador: (...a: unknown[]) => listarOv(...a),
  getOrdenVentaOperadorById: (...a: unknown[]) => getOvById(...a),
}));
vi.mock("../surtido/list-orden-ids-con-surtido-captura", () => ({
  listOrdenIdsConSurtidoCaptura: (...a: unknown[]) => idsFotos(...a),
}));
vi.mock("../print/list-orden-ids-correo-no-enviado", () => ({
  listOrdenIdsCorreoNoEnviado: (...a: unknown[]) => idsCorreo(...a),
}));
vi.mock("../../shared/hooks/useOrdenesVentaSubscription", () => ({
  useOrdenesVentaSubscription: (
    _cuenta: unknown,
    cb: (payload: import("../../shared/hooks/ordenes-venta-realtime.types").OrdenVentaRealtimePostgresPayload) => void,
  ) => {
    alCambiar = cb;
  },
}));
vi.mock("@/hooks/shared/useVisibleInterval", () => ({
  useVisibleInterval: (...a: unknown[]) => intervalo(...a),
}));
vi.mock("@/modules/configurator/cuentas/hooks/useCuentaZonaHoraria", () => ({
  useCuentaZonaHoraria: () => "America/Bogota",
}));

const runScoped = <T,>(fn: () => Promise<T>) => fn();
const filas = [{ idOrdenVenta: "ov-1" }, { idOrdenVenta: "ov-2" }];

describe("useOrdenesVentaListadoData", () => {
  beforeEach(() => {
    listarOv.mockReset().mockResolvedValue(filas);
    getOvById.mockReset();
    idsFotos.mockReset().mockResolvedValue(new Set(["ov-1"]));
    idsCorreo.mockReset().mockResolvedValue(new Set(["ov-2"]));
    intervalo.mockReset();
    alCambiar = undefined;
  });

  it("sin cuenta no consulta y devuelve datos vacíos", async () => {
    const { result } = renderHook(() =>
      useOrdenesVentaListadoData({ codigoCuenta: null, runScoped }),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(listarOv).not.toHaveBeenCalled();
    expect(result.current.data).toBeNull();
    expect(intervalo).toHaveBeenCalledWith(expect.any(Function), INTERVALO_RECARGA_LISTADO_MS, false);
  });

  it("carga filas, ids con fotos e ids con correo no enviado", async () => {
    const { result } = renderHook(() =>
      useOrdenesVentaListadoData({ codigoCuenta: "C-1", runScoped }),
    );
    await waitFor(() => expect(result.current.data).not.toBeNull());
    expect(listarOv).toHaveBeenCalledWith({ codigoCuenta: "C-1" });
    expect(idsFotos).toHaveBeenCalledWith({ codigoCuenta: "C-1", idOrdenes: ["ov-1", "ov-2"] });
    expect(result.current.data?.rows).toEqual(filas);
    expect([...result.current.data!.idsConFotosCaptura]).toEqual(["ov-1"]);
    expect([...result.current.data!.idsCorreoNoEnviado]).toEqual(["ov-2"]);
    expect(result.current.zonaHoraria).toBe("America/Bogota");
  });

  it("si fallan las consultas auxiliares igual entrega las filas", async () => {
    idsFotos.mockRejectedValue(new Error("x"));
    idsCorreo.mockRejectedValue(new Error("y"));
    const { result } = renderHook(() =>
      useOrdenesVentaListadoData({ codigoCuenta: "C-1", runScoped }),
    );
    await waitFor(() => expect(result.current.data?.rows).toEqual(filas));
    expect(result.current.data!.idsConFotosCaptura.size).toBe(0);
    expect(result.current.data!.idsCorreoNoEnviado.size).toBe(0);
  });

  it("DELETE en realtime parchea sin recargar el listado completo", async () => {
    const { result } = renderHook(() =>
      useOrdenesVentaListadoData({ codigoCuenta: "C-1", runScoped }),
    );
    await waitFor(() => expect(result.current.data).not.toBeNull());
    listarOv.mockClear();
    act(() => {
      alCambiar?.({
        table: "orden_venta",
        eventType: "DELETE",
        new: {},
        old: { id_orden_venta: "ov-1" },
      });
    });
    await waitFor(() =>
      expect(result.current.data?.rows.map((r) => r.idOrdenVenta)).toEqual([
        "ov-2",
      ]),
    );
    expect(listarOv).not.toHaveBeenCalled();
    expect(getOvById).not.toHaveBeenCalled();
  });

  it("UPDATE en orden_venta hace fetch puntual y merge", async () => {
    getOvById.mockResolvedValue({
      idOrdenVenta: "ov-1",
      venta: "OV-editada",
      fecha: "2025-01-01T00:00:00.000Z",
    });
    const { result } = renderHook(() =>
      useOrdenesVentaListadoData({ codigoCuenta: "C-1", runScoped }),
    );
    await waitFor(() => expect(result.current.data).not.toBeNull());
    listarOv.mockClear();
    await act(async () => {
      alCambiar?.({
        table: "orden_venta",
        eventType: "UPDATE",
        new: {
          codigo_cuenta: "C-1",
          id_orden_venta: "ov-1",
          estado: "confirmada",
        },
        old: {},
      });
    });
    await waitFor(() =>
      expect(
        result.current.data?.rows.find((r) => r.idOrdenVenta === "ov-1")?.venta,
      ).toBe("OV-editada"),
    );
    expect(getOvById).toHaveBeenCalledWith({
      codigoCuenta: "C-1",
      idOrdenVenta: "ov-1",
    });
    expect(listarOv).not.toHaveBeenCalled();
  });

  it("cambio en orden_venta_linea recarga con rebote de 250 ms", async () => {
    const { result } = renderHook(() =>
      useOrdenesVentaListadoData({ codigoCuenta: "C-1", runScoped }),
    );
    await waitFor(() => expect(result.current.data).not.toBeNull());
    vi.useFakeTimers();
    try {
      listarOv.mockClear();
      act(() => {
        alCambiar?.({
          table: "orden_venta_linea",
          eventType: "UPDATE",
          new: { id_orden_venta: "ov-1" },
          old: {},
        });
        alCambiar?.({
          table: "orden_venta_linea",
          eventType: "UPDATE",
          new: { id_orden_venta: "ov-2" },
          old: {},
        });
      });
      expect(listarOv).not.toHaveBeenCalled();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(260);
      });
      expect(listarOv).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("el intervalo de seguridad recarga la lista", async () => {
    const { result } = renderHook(() =>
      useOrdenesVentaListadoData({ codigoCuenta: "C-1", runScoped }),
    );
    await waitFor(() => expect(result.current.data).not.toBeNull());
    listarOv.mockClear();
    const [alIntervalo, ms, activo] = intervalo.mock.calls.at(-1)!;
    expect(ms).toBe(90_000);
    expect(activo).toBe(true);
    await act(async () => {
      alIntervalo();
    });
    await waitFor(() => expect(listarOv).toHaveBeenCalledTimes(1));
  });
});
