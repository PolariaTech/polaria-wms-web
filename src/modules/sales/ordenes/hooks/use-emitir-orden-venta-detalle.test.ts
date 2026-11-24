import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import type { OrdenVentaDetalleRow } from "../../shared/types/sales.types";
import {
  useEmitirOrdenVentaDetalle,
  type UseEmitirOrdenVentaDetalleArgs,
} from "./use-emitir-orden-venta-detalle";

const emitir = vi.fn();
vi.mock("../../shared/services/sales-api.service", () => ({
  emitirOrdenVentaApi: (...args: unknown[]) => emitir(...args),
}));
const fetchFlag = vi.fn();
const autoPrint = vi.fn();
vi.mock("../print/auto-print-ov-tras-emitir", () => ({
  fetchAutoImprimirFlag: (...args: unknown[]) => fetchFlag(...args),
  autoPrintOrdenVentaTrasEmitir: (...args: unknown[]) => autoPrint(...args),
}));

const orden = (parcial: Partial<OrdenVentaDetalleRow> = {}) =>
  ({
    id: "ov-1",
    codigo: "OV-1",
    estado: "por_confirmar",
    id_comprador: "cli-1",
    lineas: [{ precio_unitario: 10 }],
    ...parcial,
  }) as unknown as OrdenVentaDetalleRow;

function armar(parcial: Partial<UseEmitirOrdenVentaDetalleArgs> = {}) {
  const args: UseEmitirOrdenVentaDetalleArgs = {
    idOrdenVenta: "ov-1",
    codigoCuenta: "C-1",
    orden: orden(),
    puedeEmitir: true,
    setOrden: vi.fn(),
    setActionError: vi.fn(),
    reloadDetalle: vi.fn(),
    onEmitted: vi.fn(),
    onEmitSuccess: vi.fn(),
    onAutoPrintResult: vi.fn(),
    ...parcial,
  };
  const hook = renderHook(() => useEmitirOrdenVentaDetalle(args));
  return { args, hook };
}

describe("useEmitirOrdenVentaDetalle", () => {
  beforeEach(() => {
    emitir.mockReset();
    fetchFlag.mockReset();
    autoPrint.mockReset();
  });

  it("no emite si no se puede emitir", () => {
    const { args, hook } = armar({ puedeEmitir: false });
    act(() => hook.result.current.handleEmitir());
    expect(emitir).not.toHaveBeenCalled();
    expect(args.setActionError).not.toHaveBeenCalled();
  });

  it("sin comprador del catálogo avisa y no emite", () => {
    const { args, hook } = armar({ orden: orden({ id_comprador: "  " }) });
    act(() => hook.result.current.handleEmitir());
    expect(args.setActionError).toHaveBeenCalledWith(
      expect.stringContaining("Selecciona un cliente del catálogo"),
    );
    expect(emitir).not.toHaveBeenCalled();
  });

  it("con un precio inválido avisa y no emite", () => {
    const { args, hook } = armar({
      orden: orden({ lineas: [{ precio_unitario: -1 }] as never }),
    });
    act(() => hook.result.current.handleEmitir());
    expect(args.setActionError).toHaveBeenCalledWith(
      expect.stringContaining("precio inválido"),
    );
    expect(emitir).not.toHaveBeenCalled();
  });

  it("emite, avisa el éxito y recarga el detalle en silencio", async () => {
    emitir.mockResolvedValue({ estado: "confirmada", venta: "OV-77" });
    fetchFlag.mockResolvedValue(false);
    const { args, hook } = armar();
    act(() => hook.result.current.handleEmitir());
    expect(hook.result.current.isEmitting).toBe(true);
    await waitFor(() => expect(hook.result.current.isEmitting).toBe(false));

    expect(emitir).toHaveBeenCalledWith("ov-1");
    expect(args.onEmitSuccess).toHaveBeenCalledWith({ idOrdenVenta: "ov-1", codigo: "OV-77" });
    expect(args.onEmitted).toHaveBeenCalled();
    expect(args.reloadDetalle).toHaveBeenCalledWith({ silent: true });
    expect(autoPrint).not.toHaveBeenCalled();

    const actualiza = (args.setOrden as ReturnType<typeof vi.fn>).mock.calls[0]![0] as (
      prev: OrdenVentaDetalleRow | null,
    ) => OrdenVentaDetalleRow | null;
    expect(actualiza(orden())).toMatchObject({ estado: "confirmada", codigo: "OV-77" });
    expect(actualiza(null)).toBeNull();
  });

  it("con autoimpresión activa imprime y reporta el resultado salvo «skipped»", async () => {
    emitir.mockResolvedValue({ estado: "confirmada", venta: "" });
    fetchFlag.mockResolvedValue(true);
    autoPrint.mockResolvedValue({ status: "ok" });
    const { args, hook } = armar();
    act(() => hook.result.current.handleEmitir());
    await waitFor(() => expect(args.onAutoPrintResult).toHaveBeenCalledWith({ status: "ok" }));
    expect(args.onEmitSuccess).toHaveBeenCalledWith({ idOrdenVenta: "ov-1", codigo: "OV-1" });

    autoPrint.mockResolvedValue({ status: "skipped" });
    (args.onAutoPrintResult as ReturnType<typeof vi.fn>).mockClear();
    act(() => hook.result.current.handleEmitir());
    await waitFor(() => expect(autoPrint).toHaveBeenCalledTimes(2));
    expect(args.onAutoPrintResult).not.toHaveBeenCalled();
  });

  it("si falla leer la autoimpresión lo reporta como error pero igual recarga", async () => {
    emitir.mockResolvedValue({ estado: "confirmada", venta: "OV-1" });
    fetchFlag.mockRejectedValue(new Error("config rota"));
    const { args, hook } = armar();
    act(() => hook.result.current.handleEmitir());
    await waitFor(() =>
      expect(args.onAutoPrintResult).toHaveBeenCalledWith({ status: "error", message: "config rota" }),
    );
    expect(args.reloadDetalle).toHaveBeenCalledWith({ silent: true });
  });

  it("un DomainServiceError muestra su mensaje; otro error, el genérico", async () => {
    emitir.mockRejectedValueOnce(new DomainServiceError("Stock insuficiente", "VALIDATION"));
    const a = armar();
    act(() => a.hook.result.current.handleEmitir());
    await waitFor(() => expect(a.args.setActionError).toHaveBeenLastCalledWith("Stock insuficiente"));

    emitir.mockRejectedValueOnce(new Error("x"));
    const b = armar();
    act(() => b.hook.result.current.handleEmitir());
    await waitFor(() =>
      expect(b.args.setActionError).toHaveBeenLastCalledWith("No se pudo emitir la venta."),
    );
    await waitFor(() => expect(b.hook.result.current.isEmitting).toBe(false));
  });
});
