import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCustodioOrdenSalida } from "./useCustodioOrdenSalida";

const showToast = vi.fn();
const listCamionesAdmin = vi.fn();
const crearPaqueteDespachoApi = vi.fn();

vi.mock("@/components/shared/toast/PolariaToastProvider", () => ({
  usePolariaToast: () => ({ showToast }),
}));
vi.mock("@/modules/admin-panel/camiones/services/camiones.service", () => ({
  formatCamionId: (id: string) => id,
  listCamionesAdmin: (...args: unknown[]) => listCamionesAdmin(...args),
}));
vi.mock("@/modules/sales", () => ({
  getOrdenVentaDetalle: vi.fn(async () => ({ lineas: [] })),
}));
vi.mock("@/modules/transport", () => ({
  crearPaqueteDespachoApi: (...args: unknown[]) =>
    crearPaqueteDespachoApi(...args),
}));

const VENTAS = [
  { idOrdenVenta: "ov-1", venta: "V-1", comprador: "A", cuenta: "C1", estado: "confirmada" },
  { idOrdenVenta: "ov-2", venta: "V-2", comprador: "B", cuenta: "C2", estado: "confirmada" },
  { idOrdenVenta: "ov-3", venta: "V-3", comprador: "B", cuenta: "C1", estado: "borrador" },
] as never;

function setup(overrides: Partial<Parameters<typeof useCustodioOrdenSalida>[0]> = {}) {
  const onRefresh = vi.fn();
  const onPaqueteEnviado = vi.fn();
  const hook = renderHook(() =>
    useCustodioOrdenSalida({
      ventas: VENTAS,
      cajasEnSalida: 2,
      codigoCuenta: "C1",
      idBodega: "B1",
      onRefresh,
      onPaqueteEnviado,
      ...overrides,
    }),
  );
  return { ...hook, onRefresh, onPaqueteEnviado };
}

describe("useCustodioOrdenSalida", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listCamionesAdmin.mockResolvedValue([
      { idCamion: "cam-1", placa: "P1", codigo: "K1", disponible: true },
      { idCamion: "cam-2", placa: "P2", codigo: "K2", disponible: false },
    ]);
  });

  it("filtra ventas activas y carga solo camiones disponibles", async () => {
    const { result } = setup();

    await waitFor(() => expect(result.current.camiones).toHaveLength(1));
    expect(result.current.ventasActivas.map((v) => v.idOrdenVenta)).toEqual([
      "ov-1",
      "ov-2",
    ]);
  });

  it("detecta mezcla de cuentas y bloquea armar paquete", async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.camiones).toHaveLength(1));

    act(() => result.current.handleSelectPaqueteVenta(VENTAS[0]));
    act(() => result.current.handleSelectPaqueteVenta(VENTAS[1]));
    expect(result.current.mezclaCuentas).toBe(true);
    expect(result.current.canPreview).toBe(false);

    act(() => result.current.handleArmarPaquete());
    expect(result.current.paqueteArmado).toBe(false);
  });

  it("arma y cancela el paquete", async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.camiones).toHaveLength(1));

    act(() => result.current.handleSelectPaqueteVenta(VENTAS[0]));
    expect(result.current.paqueteFieldLabel).toBe("V-1 · A");

    act(() => result.current.handleArmarPaquete());
    expect(result.current.paqueteArmado).toBe(true);
    expect(result.current.ventasPaquete).toHaveLength(1);

    act(() => result.current.handleCancelarPaquete());
    expect(result.current.paqueteArmado).toBe(false);
  });

  it("envía el paquete y notifica", async () => {
    crearPaqueteDespachoApi.mockResolvedValue({
      codigoViaje: "VJ-1",
      placaCamion: "P1",
    });
    const { result, onRefresh, onPaqueteEnviado } = setup();
    await waitFor(() => expect(result.current.camiones).toHaveLength(1));

    act(() => result.current.handleSelectPaqueteVenta(VENTAS[0]));
    act(() => result.current.handleArmarPaquete());
    act(() => result.current.setCamionId("cam-1"));

    await act(async () => {
      await result.current.handleEnviarPaquete();
    });

    expect(crearPaqueteDespachoApi).toHaveBeenCalledWith({
      codigoCuenta: "C1",
      idBodega: "B1",
      idCamion: "cam-1",
      idOrdenesVenta: ["ov-1"],
    });
    expect(onPaqueteEnviado).toHaveBeenCalled();
    expect(onRefresh).toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: "success" }),
    );
  });

  it("no envía sin cajas en salida", async () => {
    const { result } = setup({ cajasEnSalida: 0 });
    await waitFor(() => expect(result.current.camiones).toHaveLength(1));

    act(() => result.current.handleSelectPaqueteVenta(VENTAS[0]));
    act(() => result.current.handleArmarPaquete());
    act(() => result.current.setCamionId("cam-1"));

    await act(async () => {
      await result.current.handleEnviarPaquete();
    });

    expect(crearPaqueteDespachoApi).not.toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Sin cajas en salida" }),
    );
  });
});
