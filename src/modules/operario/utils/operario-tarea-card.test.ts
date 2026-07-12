import { describe, expect, it } from "vitest";
import type { OperarioTareaView } from "../types/operario-tarea.types";
import { resolveOperarioTareaFlow } from "./operario-tarea-card";

function buildTarea(
  overrides: Partial<OperarioTareaView> = {},
): OperarioTareaView {
  return {
    id_tarea: "tarea-1",
    codigo_cuenta: "MIT00",
    id_bodega: "bod-1",
    tipo: "movimiento",
    estado: "pendiente",
    id_asignado: "usr-1",
    id_orden_trabajo: "ord-1",
    titulo: "OT-000001",
    descripcion: null,
    created_at: "2026-07-01T20:04:00.000Z",
    updated_at: "2026-07-01T20:04:00.000Z",
    tipoFlujo: null,
    origenCodigo: null,
    destinoCodigo: null,
    ordenCodigo: null,
    ...overrides,
  };
}

describe("operario-tarea-card", () => {
  it("ingreso: slot de ingreso → casillero destino", () => {
    const flow = resolveOperarioTareaFlow(
      buildTarea({
        tipoFlujo: "a_bodega",
        origenCodigo: "ING-02",
        destinoCodigo: "A-14",
      }),
    );

    expect(flow.typeLabel).toBe("Ingreso");
    expect(flow.sourceValue).toBe("ING-02");
    expect(flow.destinationValue).toBe("A-14");
  });

  it("bodega a bodega: slot origen → slot destino", () => {
    const flow = resolveOperarioTareaFlow(
      buildTarea({
        tipoFlujo: "bodega_a_bodega",
        origenCodigo: "B-03",
        destinoCodigo: "C-07",
      }),
    );

    expect(flow.typeLabel).toBe("Movimiento interno");
    expect(flow.sourceValue).toBe("B-03");
    expect(flow.destinationValue).toBe("C-07");
  });

  it("revisar: mismo slot en origen y destino", () => {
    const flow = resolveOperarioTareaFlow(
      buildTarea({
        tipoFlujo: "revisar",
        origenCodigo: "D-11",
        destinoCodigo: "D-11",
      }),
    );

    expect(flow.typeLabel).toBe("Revisión");
    expect(flow.sourceValue).toBe("D-11");
    expect(flow.destinationValue).toBe("D-11");
  });

  it("salida: slot origen → zona de salida", () => {
    const flow = resolveOperarioTareaFlow(
      buildTarea({
        tipoFlujo: "a_salida",
        origenCodigo: "A-02",
        destinoCodigo: "SAL-01",
      }),
    );

    expect(flow.typeLabel).toBe("Salida");
    expect(flow.sourceValue).toBe("A-02");
    expect(flow.destinationLabel).toBe("Salida");
    expect(flow.destinationValue).toBe("SAL-01");
  });

  it("salida sin destino explícito muestra asignación automática", () => {
    const flow = resolveOperarioTareaFlow(
      buildTarea({
        tipoFlujo: "a_salida",
        origenCodigo: "A-02",
        destinoCodigo: null,
      }),
    );

    expect(flow.destinationValue).toBe("Asignación automática");
  });
});
