import { describe, expect, it, vi } from "vitest";
import type { OrdenTrabajoHija } from "../utils/origen/origen-correo-ordenes-trabajo";
import {
  hidratarFormularioDesdeHija,
  type SettersHidratacionOt,
} from "./hidratar-formulario-desde-hija";

function hijaConAlmacen(almacen: string, id = "ot-1"): OrdenTrabajoHija {
  return {
    id,
    label: `${almacen}`,
    numeroPedido: "OC-1",
    almacen,
    referenciaPedido: "REF-1",
    fecha: "2026-04-01",
    responsableExterno: "Ana",
    renglones: [
      {
        Producto: "TOMATE",
        Cantidad: 1,
        Unidad: "KGS",
        Almacen: almacen,
        Anden: "A1",
        "Ventana desde": "08:00",
        "Ventana hasta": "10:00",
        Prioridad: "Normal",
        "Referencia pedido": "REF-1",
      },
    ],
    totalCantidad: 1,
  };
}

function settersMock(): SettersHidratacionOt & {
  centro: { current: string };
} {
  const centro = { current: "VIEJO" };
  return {
    centro,
    setCentroConsumo: vi.fn((value: string | ((prev: string) => string)) => {
      centro.current =
        typeof value === "function" ? value(centro.current) : value;
    }),
    setOrdenCompraHotel: vi.fn(),
    setReferenciaPedido: vi.fn(),
    setFechaEntrega: vi.fn(),
    setAnden: vi.fn(),
    setVentanaDesde: vi.fn(),
    setVentanaHasta: vi.fn(),
    setPrioridad: vi.fn(),
    setAutoFields: vi.fn((updater) => updater(new Set())),
    setWarnFields: vi.fn((updater) => updater(new Set(["centroConsumo"]))),
    setMissingFields: vi.fn((updater) => updater(new Set(["centroConsumo"]))),
  };
}

describe("hidratarFormularioDesdeHija (REQ-374)", () => {
  it("con forzarCamposOt pisa el centro con el de la hija", () => {
    const setters = settersMock();
    hidratarFormularioDesdeHija(hijaConAlmacen("COCINA B"), setters, {
      forzarCamposOt: true,
    });
    expect(setters.centro.current).toBe("COCINA B");
    expect(setters.setCentroConsumo).toHaveBeenCalled();
  });

  it("sin forzarCamposOt no pisa un centro ya editado (REQ-311)", () => {
    const setters = settersMock();
    setters.centro.current = "EDITADO";
    hidratarFormularioDesdeHija(hijaConAlmacen("COCINA B"), setters, {
      forzarCamposOt: false,
    });
    expect(setters.centro.current).toBe("EDITADO");
  });

  it("sin forzarCamposOt rellena centro vacío", () => {
    const setters = settersMock();
    setters.centro.current = "   ";
    hidratarFormularioDesdeHija(hijaConAlmacen("COCINA B"), setters, {
      forzarCamposOt: false,
    });
    expect(setters.centro.current).toBe("COCINA B");
  });
});
