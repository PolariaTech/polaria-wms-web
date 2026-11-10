import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useAvisosValidacionOv } from "./avisos-validacion-ov";

const avisosBase = {
  discrepancias: [],
  fechaEntrega: "2020-01-01",
  fechaEntregaAtrasada: false,
  correo: "",
  warnFields: new Set<string>(),
  ordenCompraHotel: "",
  ordenesTrabajoForm: [],
  compradorLabel: "",
  editingId: "",
  operadorRowsForDuplicado: [],
  idOrdenVenta: null,
  origenTexto: "",
  totalSolicitudDetectado: null as number | null,
  totalOvCompleta: 0,
  totalVenta: 0,
};

describe("useAvisosValidacionOv", () => {
  it("una fecha de entrega atrasada entra al aviso de revisión", () => {
    const { result } = renderHook(() =>
      useAvisosValidacionOv({ ...avisosBase, fechaEntregaAtrasada: true } as never),
    );
    expect(result.current.avisosValidacion).toEqual([
      expect.objectContaining({
        fieldKey: "fechaEntrega",
        db: "Hoy o posterior",
      }),
    ]);
    expect(result.current.avisosCatalogoValidacion).toHaveLength(1);
  });

  it("sin discrepancias ni orden de compra no hay avisos", () => {
    const { result } = renderHook(() =>
      useAvisosValidacionOv(avisosBase as never),
    );
    expect(result.current.avisosValidacion).toEqual([]);
    expect(result.current.avisoPotencialDuplicado).toBeNull();
  });

  it("REQ-279: avisa si el total OV no cuadra con el de la solicitud", () => {
    const { result } = renderHook(() =>
      useAvisosValidacionOv({
        ...avisosBase,
        origenTexto: "TOTAL: $1,500.00",
        totalOvCompleta: 1000,
      } as never),
    );
    expect(result.current.avisosValidacion).toEqual([
      expect.objectContaining({ fieldKey: "totalSolicitud", campo: "Total" }),
    ]);
  });

  it("REQ-279: prioriza totalSolicitudDetectado (adjuntos) sobre el cuerpo", () => {
    const { result } = renderHook(() =>
      useAvisosValidacionOv({
        ...avisosBase,
        origenTexto: "TOTAL: $1,500.00",
        totalSolicitudDetectado: 2450,
        totalOvCompleta: 1000,
      } as never),
    );
    expect(result.current.avisosValidacion).toEqual([
      expect.objectContaining({
        fieldKey: "totalSolicitud",
        db: expect.stringMatching(/2[,.]450/),
      }),
    ]);
  });
});
