import { act, renderHook, waitFor } from "@testing-library/react";
import type { FormEvent } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useOrdenProcesamientoCreateForm } from "./useOrdenProcesamientoCreateForm";

const mockUseCompany = vi.fn();
const mockUseAuthStore = vi.fn();
const mockListBodegas = vi.fn();
const mockListPrimarios = vi.fn();
const mockGetStock = vi.fn();
const mockCreateSolicitud = vi.fn();

vi.mock("@/providers/tenant/CompanyProvider", () => ({
  useCompany: () => mockUseCompany(),
}));

vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (selector: (s: { session: { idUsuario: string } | null }) => unknown) =>
    mockUseAuthStore(selector),
}));

vi.mock("@/modules/admin-panel", () => ({
  listBodegasInternasVinculadasAdmin: (...args: unknown[]) =>
    mockListBodegas(...args),
}));

vi.mock("../../shared/services/processing.service", () => ({
  listProductosPrimariosConSecundarioProcesamiento: (...args: unknown[]) =>
    mockListPrimarios(...args),
  getStockProductoBodega: (...args: unknown[]) => mockGetStock(...args),
  createSolicitudProcesamiento: (...args: unknown[]) =>
    mockCreateSolicitud(...args),
}));

const BODEGA_A = {
  idBodega: "bod-1",
  nombre: "Bodega Norte",
  codigo: "BN",
} as never;

const BODEGA_B = {
  idBodega: "bod-2",
  nombre: "Bodega Sur",
  codigo: "BS",
} as never;

const PRODUCTO_PRIMARIO = {
  idProducto: "prod-p1",
  codigo: "P1",
  nombre: "Tomate Bola",
  reglaConversionCantidadPrimario: 1,
  reglaConversionUnidadesSecundario: null,
  perdidaProcesamientoPct: 0,
} as never;

const PRODUCTO_SECUNDARIO = {
  idProducto: "prod-s1",
  codigo: "S1",
  nombre: "Tomate Empacado",
  reglaConversionCantidadPrimario: 1,
  reglaConversionUnidadesSecundario: 4,
  perdidaProcesamientoPct: 5,
} as never;

function crearSubmitEvent(): FormEvent<HTMLFormElement> {
  return { preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>;
}

describe("useOrdenProcesamientoCreateForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCompany.mockReturnValue({
      codigoCuenta: "CTA-1",
      activeBodegaId: "bod-2",
    });
    mockUseAuthStore.mockImplementation(
      (selector: (s: { session: { idUsuario: string } | null }) => unknown) =>
        selector({ session: { idUsuario: "usr-1" } }),
    );
    mockListPrimarios.mockResolvedValue([PRODUCTO_PRIMARIO]);
    mockListBodegas.mockResolvedValue([BODEGA_A, BODEGA_B]);
    mockGetStock.mockResolvedValue(25);
    mockCreateSolicitud.mockResolvedValue({ id: "sol-1" });
  });

  it("carga primarios y bodegas al abrir y prefiere activeBodegaId", async () => {
    const { result } = renderHook(() =>
      useOrdenProcesamientoCreateForm({
        open: true,
        onClose: vi.fn(),
        onCreated: vi.fn(),
      }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.primarios).toEqual([PRODUCTO_PRIMARIO]);
    expect(result.current.bodegas).toEqual([BODEGA_A, BODEGA_B]);
    expect(result.current.idBodega).toBe("bod-2");
    expect(result.current.error).toBeNull();
  });

  it("muestra error cuando falla la carga inicial del formulario", async () => {
    mockListPrimarios.mockRejectedValueOnce(new Error("Fallo catálogo"));

    const { result } = renderHook(() =>
      useOrdenProcesamientoCreateForm({
        open: true,
        onClose: vi.fn(),
        onCreated: vi.fn(),
      }),
    );

    await waitFor(() => {
      expect(result.current.error).toBe("Fallo catálogo");
    });
    expect(result.current.isLoading).toBe(false);
  });

  it("consulta stock al elegir insumo, calcula conversión y permite enviar solicitud válida", async () => {
    const onClose = vi.fn();
    const onCreated = vi.fn();

    const { result } = renderHook(() =>
      useOrdenProcesamientoCreateForm({
        open: true,
        onClose,
        onCreated,
      }),
    );

    await waitFor(() => {
      expect(result.current.idBodega).toBe("bod-2");
    });

    act(() => {
      result.current.handleInsumoSelect(PRODUCTO_PRIMARIO);
    });

    await waitFor(() => {
      expect(result.current.stockKg).toBe(25);
    });
    expect(mockGetStock).toHaveBeenCalledWith("bod-2", "prod-p1", "CTA-1");

    act(() => {
      result.current.handleResultadoSelect(PRODUCTO_SECUNDARIO);
      result.current.setCantidadElegida(10);
    });

    await waitFor(() => {
      expect(result.current.conversionUnidades).toBe("4");
    });

    await act(async () => {
      await result.current.handleSubmit(crearSubmitEvent());
    });

    expect(mockCreateSolicitud).toHaveBeenCalledWith(
      expect.objectContaining({
        codigoCuenta: "CTA-1",
        idBodega: "bod-2",
        idSolicitante: "usr-1",
        idProductoPrimario: "prod-p1",
        idProductoSecundario: "prod-s1",
        kilosPrimario: 10,
      }),
    );
    expect(onCreated).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("muestra error de validación si faltan datos y maneja error de stock o envío", async () => {
    mockGetStock.mockRejectedValueOnce(new Error("Sin red"));

    const { result } = renderHook(() =>
      useOrdenProcesamientoCreateForm({
        open: true,
        onClose: vi.fn(),
        onCreated: vi.fn(),
      }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.handleSubmit(crearSubmitEvent());
    });
    expect(result.current.error).toBeTruthy();
    expect(mockCreateSolicitud).not.toHaveBeenCalled();

    act(() => {
      result.current.handleInsumoSelect(PRODUCTO_PRIMARIO);
    });

    await waitFor(() => {
      expect(result.current.stockError).toBe(
        "No se pudo consultar el stock del mapa.",
      );
    });
  });
});
