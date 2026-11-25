import { beforeEach, describe, expect, it, vi } from "vitest";
import { setSupabaseClientForTests } from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { avanzarEstadoOrdenVenta, borrarOrdenVenta, updateOrdenVenta } from "./sales.service";
import { mockUpdateOrdenVentaDeps } from "./sales.service.test-helpers";

const cancelarOrdenVentaApi = vi.hoisted(() => vi.fn());
const avanzarEstadoOrdenVentaApi = vi.hoisted(() => vi.fn());

vi.mock("./sales-api.service", () => ({
  cancelarOrdenVentaApi: (...args: unknown[]) => cancelarOrdenVentaApi(...args),
  avanzarEstadoOrdenVentaApi: (...args: unknown[]) =>
    avanzarEstadoOrdenVentaApi(...args),
  emitirOrdenVentaApi: vi.fn(),
  listOrdenesVentaApi: vi.fn(),
  listOrdenesVentaParaSalida: vi.fn(),
}));

describe("sales.service", () => {
  beforeEach(() => {
    setSupabaseClientForTests(null);
    cancelarOrdenVentaApi.mockReset();
    cancelarOrdenVentaApi.mockResolvedValue({ estado: "cancelada" });
    avanzarEstadoOrdenVentaApi.mockReset();
    avanzarEstadoOrdenVentaApi.mockResolvedValue({ estado: "facturada" });
  });

  it("sin guardarAvance rechaza cantidad 0", async () => {
    mockUpdateOrdenVentaDeps("por_confirmar");

    await expect(
      updateOrdenVenta({
        codigoCuenta: "CUENTA-01",
        idOrdenVenta: "ov-1",
        idBodega: "bod-1",
        idComprador: "comp-1",
        lineas: [
          {
            idProducto: "prod-1",
            cantidadPedida: 0,
            precioUnitario: 10,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(DomainServiceError);
  });


  it("updateOrdenVenta rechaza una orden despachada", async () => {
    const deps = mockUpdateOrdenVentaDeps("despachada");

    await expect(
      updateOrdenVenta({
        codigoCuenta: "CUENTA-01",
        idOrdenVenta: "ov-1",
        idBodega: "bod-1",
        idBodegaDestino: "bod-dest",
        idComprador: "comp-1",
        idProducto: "prod-1",
      }),
    ).rejects.toBeInstanceOf(DomainServiceError);

    expect(deps.ordenUpdateChain.update).not.toHaveBeenCalled();
    expect(deps.lineaDeleteChain.delete).not.toHaveBeenCalled();
  });


  it("borrarOrdenVenta en por_confirmar llama cancelarOrdenVentaApi", async () => {
    const selectChain = {
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: vi.fn(),
    };
    selectChain.select.mockReturnValue(selectChain);
    selectChain.eq.mockReturnValue(selectChain);
    selectChain.maybeSingle.mockResolvedValue({
      data: { estado: "por_confirmar" },
      error: null,
    });
    setSupabaseClientForTests({ from: vi.fn(() => selectChain) } as never);

    await borrarOrdenVenta({
      codigoCuenta: "CUENTA-01",
      idOrdenVenta: "ov-dup",
    });

    expect(cancelarOrdenVentaApi).toHaveBeenCalledWith("ov-dup");
  });


  it("borrarOrdenVenta propaga fallo de cancelarOrdenVentaApi", async () => {
    const selectChain = {
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: vi.fn(),
    };
    selectChain.select.mockReturnValue(selectChain);
    selectChain.eq.mockReturnValue(selectChain);
    selectChain.maybeSingle.mockResolvedValue({
      data: { estado: "por_confirmar" },
      error: null,
    });
    setSupabaseClientForTests({ from: vi.fn(() => selectChain) } as never);
    cancelarOrdenVentaApi.mockRejectedValue(new Error("API no disponible"));

    await expect(
      borrarOrdenVenta({
        codigoCuenta: "CUENTA-01",
        idOrdenVenta: "ov-dup",
      }),
    ).rejects.toThrow("API no disponible");
  });


  it("avanzarEstadoOrdenVenta pasa de revisada a facturada", async () => {
    const selectChain = {
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: vi.fn(),
    };
    selectChain.select.mockReturnValue(selectChain);
    selectChain.eq.mockReturnValue(selectChain);
    selectChain.maybeSingle.mockResolvedValue({
      data: { estado: "revisada" },
      error: null,
    });

    const from = vi.fn(() => selectChain);
    setSupabaseClientForTests({ from } as never);

    await expect(
      avanzarEstadoOrdenVenta({
        codigoCuenta: "CUENTA-01",
        idOrdenVenta: "ov-1",
        estado: "facturada",
      }),
    ).resolves.toBe("facturada");

    expect(avanzarEstadoOrdenVentaApi).toHaveBeenCalledWith("ov-1", "facturada");
  });


  it("avanzarEstadoOrdenVenta rechaza un retroceso", async () => {
    const selectChain = {
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: vi.fn(),
    };
    selectChain.select.mockReturnValue(selectChain);
    selectChain.eq.mockReturnValue(selectChain);
    selectChain.maybeSingle.mockResolvedValue({
      data: { estado: "despachada" },
      error: null,
    });
    const from = vi.fn(() => selectChain);
    setSupabaseClientForTests({ from } as never);

    await expect(
      avanzarEstadoOrdenVenta({
        codigoCuenta: "CUENTA-01",
        idOrdenVenta: "ov-1",
        estado: "revisada",
      }),
    ).rejects.toBeInstanceOf(DomainServiceError);
  });


  it("borrarOrdenVenta en confirmada llama cancelarOrdenVentaApi", async () => {
    const selectChain = {
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: vi.fn(),
    };
    selectChain.select.mockReturnValue(selectChain);
    selectChain.eq.mockReturnValue(selectChain);
    selectChain.maybeSingle.mockResolvedValue({
      data: { estado: "confirmada" },
      error: null,
    });
    setSupabaseClientForTests({ from: vi.fn(() => selectChain) } as never);

    await borrarOrdenVenta({
      codigoCuenta: "CUENTA-01",
      idOrdenVenta: "ov-1",
    });

    expect(cancelarOrdenVentaApi).toHaveBeenCalledWith("ov-1");
  });
});
