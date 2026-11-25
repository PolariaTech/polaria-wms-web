import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrdenVentaOperadorRow } from "../../shared/types/sales.types";
import { useOvPaneles } from "./use-ov-paneles";

const setCypherOpen = vi.fn();
const setOvEditOpen = vi.fn();
vi.mock("@/stores/shell-overlay.store", () => ({
  useShellOverlayStore: (sel: (s: unknown) => unknown) => sel({ setCypherOpen, setOvEditOpen }),
}));
const lock = {
  soloLectura: false,
  holderNombre: null,
  resetLockUi: vi.fn(),
  releaseCurrent: vi.fn().mockResolvedValue(undefined),
  prepareOpenEdit: vi.fn().mockResolvedValue({ soloLectura: false }),
};
vi.mock("./use-ov-edit-lock-session", () => ({ useOvEditLockSession: () => lock }));

const fila = (id: string, estado: string) =>
  ({ idOrdenVenta: id, estado }) as unknown as OrdenVentaOperadorRow;

function usar(inspect = false, codigoCuenta: string | null = "C-1") {
  const reload = vi.fn().mockResolvedValue(undefined);
  const hook = renderHook(() => useOvPaneles({ codigoCuenta, inspect, reload }));
  return { reload, ...hook };
}

describe("useOvPaneles", () => {
  beforeEach(() => {
    setCypherOpen.mockClear();
    setOvEditOpen.mockClear();
    lock.resetLockUi.mockClear();
    lock.releaseCurrent.mockClear();
    lock.prepareOpenEdit.mockClear();
  });

  it("empieza sin paneles abiertos", () => {
    const { result } = usar();
    expect(result.current).toMatchObject({
      isCreateOpen: false,
      editingId: null,
      detalleId: null,
      cypherId: null,
      companionWithCypher: false,
    });
  });

  it("avisa al shell cuando hay Cypher abierto (oculta el launcher de Mateo)", () => {
    const { result } = usar();
    act(() => result.current.setCypherId("ov-1"));
    expect(setCypherOpen).toHaveBeenLastCalledWith(true);
  });

  it("bloquea Mateo con el formulario abierto, salvo en inspección (REQ-149)", () => {
    const a = usar();
    act(() => a.result.current.setIsCreateOpen(true));
    expect(setOvEditOpen).toHaveBeenLastCalledWith(true);

    setOvEditOpen.mockClear();
    const b = usar(true);
    act(() => b.result.current.setIsCreateOpen(true));
    expect(setOvEditOpen).not.toHaveBeenCalledWith(true);
  });

  it("companionWithCypher es true cuando detalle y Cypher son la misma OV", () => {
    const { result } = usar();
    act(() => {
      result.current.setDetalleId("ov-1");
      result.current.setCypherId("ov-1");
    });
    expect(result.current.companionWithCypher).toBe(true);
    act(() => result.current.setCypherId("ov-2"));
    expect(result.current.companionWithCypher).toBe(false);
  });

  it("abrirNuevaVenta abre el formulario en blanco y reinicia el lock; sin cuenta no hace nada", () => {
    const { result } = usar();
    act(() => result.current.abrirNuevaVenta());
    expect(result.current.isCreateOpen).toBe(true);
    expect(result.current.editingId).toBeNull();
    expect(lock.resetLockUi).toHaveBeenCalled();

    const sinCuenta = usar(false, null);
    act(() => sinCuenta.result.current.abrirNuevaVenta());
    expect(sinCuenta.result.current.isCreateOpen).toBe(false);
  });

  it("clic en una OV cancelada abre solo el detalle (lectura)", () => {
    const { result } = usar();
    act(() => result.current.setCypherId("x"));
    act(() => result.current.alClickFila(fila("ov-1", "cancelada")));
    expect(result.current.detalleId).toBe("ov-1");
    expect(result.current.cypherId).toBeNull();
  });

  it("clic en una OV por confirmar abre formulario + Cypher tras tomar el lock (REQ-180)", async () => {
    const { result } = usar();
    act(() => result.current.alClickFila(fila("ov-1", "por_confirmar")));
    await waitFor(() => expect(result.current.isCreateOpen).toBe(true));
    expect(lock.prepareOpenEdit).toHaveBeenCalledWith("ov-1");
    expect(result.current.editingId).toBe("ov-1");
    expect(result.current.cypherId).toBe("ov-1");
    expect(result.current.detalleId).toBeNull();
  });

  it("en inspección una OV por confirmar abre el detalle, no el formulario", () => {
    const { result } = usar(true);
    act(() => result.current.alClickFila(fila("ov-1", "por_confirmar")));
    expect(result.current.detalleId).toBe("ov-1");
    expect(result.current.isCreateOpen).toBe(false);
  });

  it("cerrarFormulario libera el lock, recarga, limpia y puede volver al detalle", async () => {
    const { result, reload } = usar();
    act(() => result.current.alClickFila(fila("ov-1", "por_confirmar")));
    await waitFor(() => expect(result.current.isCreateOpen).toBe(true));

    act(() => result.current.cerrarFormulario(true));
    expect(lock.releaseCurrent).toHaveBeenCalledWith("ov-1");
    await waitFor(() => expect(reload).toHaveBeenCalled());
    expect(result.current.isCreateOpen).toBe(false);
    expect(result.current.editingId).toBeNull();
    expect(result.current.detalleId).toBe("ov-1");
    expect(lock.resetLockUi).toHaveBeenCalled();
  });

  it("cerrarFormulario(false) no reabre el detalle", async () => {
    const { result } = usar();
    act(() => result.current.alClickFila(fila("ov-1", "por_confirmar")));
    await waitFor(() => expect(result.current.isCreateOpen).toBe(true));
    act(() => result.current.cerrarFormulario(false));
    expect(result.current.detalleId).toBeNull();
  });

  it("limpiarReagruparAlAbrir borra el id pendiente de «Modificar con IA»", () => {
    const { result } = usar();
    act(() => result.current.setReagruparAlAbrirId("ov-1"));
    expect(result.current.reagruparAlAbrirId).toBe("ov-1");
    act(() => result.current.limpiarReagruparAlAbrir());
    expect(result.current.reagruparAlAbrirId).toBeNull();
  });
});
