import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReagrupacionApiError } from "../services/reagrupar-ot.client";
import type { OrdenVentaFormEstado } from "../types/orden-venta-form-estado";
import type { OrdenTrabajoHija } from "../utils/origen/origen-correo-ordenes-trabajo";

const dividirOrdenVenta = vi.fn();
vi.mock("../services/dividir-ov.client", () => ({
  dividirOrdenVenta: (...args: unknown[]) => dividirOrdenVenta(...args),
}));

import { useAplicarDivisionOv } from "./aplicar-division-ov";

const hija = (id: string, pedido: string, producto: string): OrdenTrabajoHija => ({
  id,
  label: `${pedido} — COCINA`,
  numeroPedido: pedido,
  almacen: "COCINA",
  referenciaPedido: "",
  fecha: "",
  responsableExterno: "",
  renglones: [{ Producto: producto, Cantidad: 5, Unidad: "KGS" }],
  totalCantidad: 5,
});

const hijas = [hija("ot-1", "OC-1", "AGUACATE"), hija("ot-2", "OC-2", "LIMON")];
const lineas = [
  { nombre: "AGUACATE", codigo: "A", cantidadInput: "5", otId: "ot-1" },
  { nombre: "LIMON", codigo: "L", cantidadInput: "5", otId: "ot-2" },
];
const division = {
  criterio: "oc" as const,
  valoresSalen: ["OC-2"],
  valoresQuedan: ["OC-1"],
  otIdsQueSalen: ["ot-2"],
};

function armarEstado() {
  const pendingDraftSaveAfterReorgRef = { current: false };
  const estado = {
    editingId: "ov-1",
    lineas,
    syncActiveOtFromForm: vi.fn(() => hijas),
    applyOrdenesTrabajo: vi.fn(),
    setLineas: vi.fn(),
    setFormOtPage: vi.fn(),
    setReagruparOpen: vi.fn(),
    setError: vi.fn(),
    pendingDraftSaveAfterReorgRef,
    showToast: vi.fn(),
  };
  return estado as unknown as OrdenVentaFormEstado & typeof estado;
}

describe("useAplicarDivisionOv (REQ-262)", () => {
  beforeEach(() => {
    dividirOrdenVenta.mockReset();
  });

  it("divide en el servidor, quita del formulario lo que se fue y pide guardar el avance", async () => {
    dividirOrdenVenta.mockResolvedValue({
      ordenesNuevas: [{ idOrdenVenta: "n-1", codigo: "OV-00000009", valor: "OC-2" }],
      valoresQuedan: ["OC-1"],
    });
    const estado = armarEstado();
    const { result } = renderHook(() => useAplicarDivisionOv(estado));

    await act(() => result.current.handleDividirOrden(division));

    expect(dividirOrdenVenta).toHaveBeenCalledWith({
      idOrdenVenta: "ov-1",
      criterio: "oc",
      valoresSalen: ["OC-2"],
    });
    expect(estado.applyOrdenesTrabajo).toHaveBeenCalledWith([hijas[0]]);
    expect(estado.setLineas).toHaveBeenCalledWith([lineas[0]]);
    expect(estado.setReagruparOpen).toHaveBeenCalledWith(false);
    expect(estado.pendingDraftSaveAfterReorgRef.current).toBe(true);
    expect(estado.showToast).toHaveBeenCalledWith(
      expect.objectContaining({ content: expect.stringContaining("OV-00000009") }),
    );
  });

  it("si el servidor falla no toca el formulario y deja subir el error", async () => {
    dividirOrdenVenta.mockImplementation(() =>
      Promise.reject(
        new ReagrupacionApiError("Esta orden ya no está por confirmar.", "OV_ESTADO_CAMBIO", 409),
      ),
    );
    const estado = armarEstado();
    const { result } = renderHook(() => useAplicarDivisionOv(estado));

    await expect(result.current.handleDividirOrden(division)).rejects.toMatchObject({
      codigo: "OV_ESTADO_CAMBIO",
      message: "Esta orden ya no está por confirmar.",
    });

    expect(estado.applyOrdenesTrabajo).not.toHaveBeenCalled();
    expect(estado.setLineas).not.toHaveBeenCalled();
    expect(estado.pendingDraftSaveAfterReorgRef.current).toBe(false);
  });
});
