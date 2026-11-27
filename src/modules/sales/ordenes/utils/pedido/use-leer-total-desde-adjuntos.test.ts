import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { OrdenVentaFormEstado } from "../../types/orden-venta-form-estado";
import { useLeerTotalDesdeAdjuntos } from "./use-leer-total-desde-adjuntos";

function estadoBase(
  overrides: Partial<OrdenVentaFormEstado> = {},
): OrdenVentaFormEstado {
  return {
    step: "form",
    open: true,
    origenAdjuntos: [
      {
        nombre: "pedido.pdf",
        path: "cuenta/ov/pedido.pdf",
        mime: "application/pdf",
      },
    ],
    totalSolicitudDetectado: null,
    setTotalSolicitudDetectado: vi.fn(),
    ...overrides,
  } as OrdenVentaFormEstado;
}

describe("useLeerTotalDesdeAdjuntos", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("exporta el hook (REQ-279 adjuntos)", () => {
    expect(typeof useLeerTotalDesdeAdjuntos).toBe("function");
  });

  it("con totalSolicitud en resolve-occ setea el detectado", async () => {
    const setTotalSolicitudDetectado = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ totalSolicitud: 1234.5 }),
      }),
    );

    renderHook(() =>
      useLeerTotalDesdeAdjuntos(
        estadoBase({ setTotalSolicitudDetectado }),
      ),
    );

    await waitFor(() => {
      expect(setTotalSolicitudDetectado).toHaveBeenCalledWith(1234.5);
    });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/ov-adjuntos/resolve-occ?path="),
    );
  });

  it("si resolve-occ responde 4xx no setea total", async () => {
    const setTotalSolicitudDetectado = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({}),
      }),
    );

    renderHook(() =>
      useLeerTotalDesdeAdjuntos(
        estadoBase({ setTotalSolicitudDetectado }),
      ),
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(setTotalSolicitudDetectado).not.toHaveBeenCalled();
  });

  it("si fetch falla por red no setea total", async () => {
    const setTotalSolicitudDetectado = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network")),
    );

    renderHook(() =>
      useLeerTotalDesdeAdjuntos(
        estadoBase({ setTotalSolicitudDetectado }),
      ),
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(setTotalSolicitudDetectado).not.toHaveBeenCalled();
  });

  it("al desmontar no aplica el total de una respuesta tardía", async () => {
    const setTotalSolicitudDetectado = vi.fn();
    let resolveJson!: (value: { totalSolicitud: number }) => void;
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        new Promise<{ totalSolicitud: number }>((resolve) => {
          resolveJson = resolve;
        }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { unmount } = renderHook(() =>
      useLeerTotalDesdeAdjuntos(
        estadoBase({ setTotalSolicitudDetectado }),
      ),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(typeof resolveJson).toBe("function");
    });
    unmount();
    await act(async () => {
      resolveJson({ totalSolicitud: 999 });
      await Promise.resolve();
    });
    expect(setTotalSolicitudDetectado).not.toHaveBeenCalled();
  });

  it("REQ-425: correo con dos OC → total de la OC de esta OV", async () => {
    const setTotalSolicitudDetectado = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          totalSolicitud: 27325.35,
          totalesPorOc: { "4503007904": 27325.35, "4503007927": 22671.75 },
        }),
      }),
    );

    renderHook(() =>
      useLeerTotalDesdeAdjuntos(
        estadoBase({
          setTotalSolicitudDetectado,
          ordenCompraHotel: "4503007927",
          ordenesTrabajoForm: [],
        }),
      ),
    );

    await waitFor(() => {
      expect(setTotalSolicitudDetectado).toHaveBeenCalledWith(22671.75);
    });
  });

  it("REQ-425: otro arreglo de adjuntos con las mismas rutas no repite la lectura", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);

    const setTotalSolicitudDetectado = vi.fn();
    const { rerender } = renderHook(
      (estado: OrdenVentaFormEstado) => useLeerTotalDesdeAdjuntos(estado),
      { initialProps: estadoBase({ setTotalSolicitudDetectado }) },
    );
    rerender(estadoBase({ setTotalSolicitudDetectado }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  it("no llama fetch si ya hay totalSolicitudDetectado > 0", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    renderHook(() =>
      useLeerTotalDesdeAdjuntos(
        estadoBase({ totalSolicitudDetectado: 50 }),
      ),
    );

    await act(async () => {
      await Promise.resolve();
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
