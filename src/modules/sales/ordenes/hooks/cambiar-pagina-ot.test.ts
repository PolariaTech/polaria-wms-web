import { describe, expect, it, vi } from "vitest";
import type { OrdenTrabajoHija } from "../utils/origen/origen-correo-ordenes-trabajo";
import { ejecutarCambioPaginaOt } from "./cambiar-pagina-ot";

function hija(id: string, almacen: string): OrdenTrabajoHija {
  return {
    id,
    label: almacen,
    numeroPedido: id,
    almacen,
    referenciaPedido: "",
    fecha: "2026-01-01",
    responsableExterno: "",
    renglones: [{ Producto: "X", Cantidad: 1, Almacen: almacen }],
    totalCantidad: 1,
  };
}

describe("ejecutarCambioPaginaOt (REQ-374)", () => {
  it("sincroniza, cambia página e hidrata el centro de la OT destino", () => {
    const otA = hija("ot-a", "COCINA A");
    const otB = hija("ot-b", "COCINA B");
    const syncActiveOtFromForm = vi.fn(() => [otA, otB]);
    const applyOrdenesTrabajo = vi.fn();
    const setFormOtPage = vi.fn();
    const setCentroConsumo = vi.fn();
    ejecutarCambioPaginaOt({
      nextPage: 1,
      paginarPorOt: true,
      hijaFormActiva: otA,
      ordenesTrabajoForm: [otA, otB],
      syncActiveOtFromForm,
      applyOrdenesTrabajo,
      setFormOtPage,
      setError: vi.fn(),
      setSuccessMessage: vi.fn(),
      settersHidratacion: {
        setCentroConsumo,
        setOrdenCompraHotel: vi.fn(),
        setReferenciaPedido: vi.fn(),
        setFechaEntrega: vi.fn(),
        setAnden: vi.fn(),
        setVentanaDesde: vi.fn(),
        setVentanaHasta: vi.fn(),
        setPrioridad: vi.fn(),
        setAutoFields: vi.fn((u) => u(new Set())),
        setWarnFields: vi.fn((u) => u(new Set())),
        setMissingFields: vi.fn((u) => u(new Set())),
      },
    });
    expect(syncActiveOtFromForm).toHaveBeenCalledWith({
      propagarFechaOv: false,
    });
    expect(applyOrdenesTrabajo).toHaveBeenCalledWith([otA, otB]);
    expect(setFormOtPage).toHaveBeenCalledWith(1);
    expect(setCentroConsumo).toHaveBeenCalledWith("COCINA B");
  });
});
