import { describe, expect, it, vi } from "vitest";
import type { OrdenTrabajoHija } from "../utils/origen/origen-correo-ordenes-trabajo";
import { ejecutarCambioPaginaOt } from "./cambiar-pagina-ot";
import {
  aplicarCabeceraFormAOrdenesTrabajo,
  type CabeceraFormParaOt,
} from "./sync-ot-cabecera-renglon";

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

function cabeceraForm(almacen: string, fecha: string): CabeceraFormParaOt {
  return {
    almacen,
    numeroPedido: "",
    fecha,
    responsableExterno: "",
    telefonoOt: "",
    correoOt: "",
    direccionOt: "",
    andenOt: "",
    ventanaDesdeOt: "",
    ventanaHastaOt: "",
    notasOt: "",
    prioridadOt: "",
  };
}

function paginarConFechaDelForm(fechaForm: string, fechaHermanas = "2026-01-01") {
  const otA = hija("ot-a", "COCINA A");
  const otB = { ...hija("ot-b", "COCINA B"), fecha: fechaHermanas };
  const otC = { ...hija("ot-c", "COCINA C"), fecha: fechaHermanas };
  const hijas = [otA, otB, otC];
  const syncActiveOtFromForm = vi.fn(
    (opciones?: { propagarFechaOv?: boolean }) =>
      aplicarCabeceraFormAOrdenesTrabajo(
        hijas,
        "ot-a",
        cabeceraForm("COCINA A", fechaForm),
        { propagarFechaOv: opciones?.propagarFechaOv },
      ),
  );
  const applyOrdenesTrabajo = vi.fn();
  const setFechaEntrega = vi.fn();
  ejecutarCambioPaginaOt({
    nextPage: 1,
    paginarPorOt: true,
    hijaFormActiva: otA,
    ordenesTrabajoForm: hijas,
    syncActiveOtFromForm,
    applyOrdenesTrabajo,
    setFormOtPage: vi.fn(),
    setError: vi.fn(),
    setSuccessMessage: vi.fn(),
    settersHidratacion: {
      setCentroConsumo: vi.fn(),
      setOrdenCompraHotel: vi.fn(),
      setReferenciaPedido: vi.fn(),
      setFechaEntrega,
      setAnden: vi.fn(),
      setVentanaDesde: vi.fn(),
      setVentanaHasta: vi.fn(),
      setPrioridad: vi.fn(),
      setAutoFields: vi.fn((u) => u(new Set())),
      setWarnFields: vi.fn((u) => u(new Set())),
      setMissingFields: vi.fn((u) => u(new Set())),
    },
  });
  const aplicadas = applyOrdenesTrabajo.mock.calls[0]?.[0] as OrdenTrabajoHija[];
  return { aplicadas, setFechaEntrega };
}

describe("ejecutarCambioPaginaOt fecha de entrega (REQ-423)", () => {
  it("si cambia la fecha en una OT, la aplica a todas las OT de la OV", () => {
    const { aplicadas, setFechaEntrega } = paginarConFechaDelForm("2026-02-10");
    expect(aplicadas.map((ot) => ot.fecha)).toEqual([
      "2026-02-10",
      "2026-02-10",
      "2026-02-10",
    ]);
    expect(aplicadas.map((ot) => ot.renglones[0]?.Fecha)).toEqual([
      "2026-02-10",
      "2026-02-10",
      "2026-02-10",
    ]);
    // La OT destino muestra la fecha nueva, no la vieja.
    expect(setFechaEntrega).toHaveBeenCalledWith("2026-02-10");
  });

  it("si la fecha no cambió, no pisa las fechas de las OT hermanas (REQ-374)", () => {
    const { aplicadas } = paginarConFechaDelForm("2026-01-01", "2026-03-05");
    expect(aplicadas.map((ot) => ot.fecha)).toEqual([
      "2026-01-01",
      "2026-03-05",
      "2026-03-05",
    ]);
  });
});
