import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { OrdenVentaFormEstado } from "../types/orden-venta-form-estado";
import { useTotalesYAvisosOv } from "./use-totales-y-avisos-ov";

const totalesMock = vi.hoisted(() => ({ totalOvCompleta: 0, totalVenta: 0 }));

vi.mock("./sync-ot-formulario-totales", () => ({
  useTotalesVentaOv: () => ({
    totalOvCompleta: totalesMock.totalOvCompleta,
    totalVenta: totalesMock.totalVenta,
  }),
}));

/** Bolsa recién armada en el modal: todavía sin totales (los pone useTotalesVentaOv). */
function bolsaSinTotales(): OrdenVentaFormEstado {
  return {
    discrepancias: [],
    fechaEntrega: "2026-11-30",
    fechaEntregaAtrasada: false,
    warnFields: new Set<string>(),
    ordenCompraHotel: "4503007927",
    ordenesTrabajoForm: [],
    compradorLabel: "",
    editingId: "",
    operadorRowsForDuplicado: [],
    origenTexto: "",
    origenAdjuntos: [],
    step: "form",
    open: true,
    totalSolicitudDetectado: 22671.75,
    setTotalSolicitudDetectado: vi.fn(),
  } as unknown as OrdenVentaFormEstado;
}

function avisosDeTotal(bolsa: OrdenVentaFormEstado) {
  return bolsa.avisosValidacion.filter((aviso) => aviso.fieldKey === "totalSolicitud");
}

describe("useTotalesYAvisosOv (REQ-425)", () => {
  it("el aviso de total ve los totales del formulario: OV ≠ OC avisa", () => {
    totalesMock.totalOvCompleta = 16241.25;
    totalesMock.totalVenta = 3989.5;
    const bolsa = bolsaSinTotales();

    renderHook(() => useTotalesYAvisosOv(bolsa));

    expect(bolsa.totalOvCompleta).toBe(16241.25);
    expect(avisosDeTotal(bolsa)).toEqual([
      expect.objectContaining({ campo: "Total", db: expect.stringContaining("22,671.75") }),
    ]);
  });

  it("OV igual a la OC: sin aviso de total", () => {
    totalesMock.totalOvCompleta = 22671.75;
    totalesMock.totalVenta = 4027.5;
    const bolsa = bolsaSinTotales();

    renderHook(() => useTotalesYAvisosOv(bolsa));

    expect(avisosDeTotal(bolsa)).toEqual([]);
  });
});
