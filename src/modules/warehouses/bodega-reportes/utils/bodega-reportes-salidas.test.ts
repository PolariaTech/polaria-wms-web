import { describe, expect, it } from "vitest";
import type { OrdenTrabajoApiRow } from "@/modules/operations";
import {
  countOrdenesTrabajoSalidaEjecutadas,
  isOrdenTrabajoSalidaEjecutada,
} from "./bodega-reportes-salidas";

const baseOrden: OrdenTrabajoApiRow = {
  idOrdenTrabajo: "ord-1",
  codigoCuenta: "ACME",
  idBodega: "b1",
  codigo: "OT-000006",
  estado: "completada",
  tipo: "orden",
  tipoFlujo: "a_salida",
  idAsignado: "op-1",
  idSolicitante: null,
  idLote: null,
  idUbicacionOrigen: "u-a",
  idUbicacionDestino: "u-sal",
  observaciones: "OV OV-20260709-160103",
  createdAt: "2026-07-09T12:00:00.000Z",
  updatedAt: "2026-07-09T12:10:00.000Z",
};

describe("bodega-reportes-salidas", () => {
  it("cuenta OT a_salida ejecutada con destino", () => {
    expect(isOrdenTrabajoSalidaEjecutada(baseOrden)).toBe(true);
    expect(countOrdenesTrabajoSalidaEjecutadas([baseOrden])).toBe(1);
  });

  it("no cuenta OT pendiente ni sin destino de salida", () => {
    expect(
      isOrdenTrabajoSalidaEjecutada({
        ...baseOrden,
        estado: "pendiente",
      }),
    ).toBe(false);
    expect(
      isOrdenTrabajoSalidaEjecutada({
        ...baseOrden,
        idUbicacionDestino: null,
      }),
    ).toBe(false);
    expect(
      isOrdenTrabajoSalidaEjecutada({
        ...baseOrden,
        tipoFlujo: "a_bodega",
      }),
    ).toBe(false);
  });
});
