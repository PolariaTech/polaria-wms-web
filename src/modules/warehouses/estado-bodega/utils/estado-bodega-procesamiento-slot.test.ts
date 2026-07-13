import { describe, expect, it } from "vitest";
import {
  applyProcesamientoZonaLayout,
  buildProcesamientoEnriquecimientoByUbicacion,
  buildResultadoByUbicacionProcesamiento,
} from "./estado-bodega-procesamiento-slot";
import type { EstadoBodegaLayoutView } from "../types/estado-bodega.types";

const baseLayout: EstadoBodegaLayoutView = {
  sections: [
    {
      id: "procesamiento",
      title: "Procesamiento",
      cols: 4,
      rows: 1,
      capacity: 4,
      occupiedCount: 1,
      alertCount: 0,
      pendingTaskCount: 0,
      slots: [
        {
          slotNumber: 1,
          idUbicacion: "u-proc-1",
          codigo: "PROC-01",
          visual: "ocupada_procesado",
          productoLabel: "Primario",
          detalle: {
            productoNombre: "Primario A",
            idPaquete: "OC-001",
            cliente: "Cliente",
            cantidad: "10 kg",
            posicion: "PROC-01",
            temperatura: "0 °C",
            ordenCompraCodigo: "OC-001",
          },
        },
        {
          slotNumber: 2,
          idUbicacion: null,
          codigo: null,
          visual: "vacia",
          productoLabel: null,
          detalle: null,
        },
        {
          slotNumber: 3,
          idUbicacion: null,
          codigo: null,
          visual: "vacia",
          productoLabel: null,
          detalle: null,
        },
        {
          slotNumber: 4,
          idUbicacion: null,
          codigo: null,
          visual: "vacia",
          productoLabel: null,
          detalle: null,
        },
      ],
    },
  ],
};

const zonaParams = {
  solicitudesOperador: [
    {
      idSolicitudProcesamiento: "sol-1",
      orden: "OP-001",
      primario: "Primario A",
      secundario: "Secundario B",
      insumoPrimario: "10",
      estimSecundario: "17",
      estado: "pendiente_cierre" as const,
      fecha: "2026-01-01T00:00:00Z",
    },
  ],
  solicitudesDb: [
    {
      id_solicitud_procesamiento: "sol-1",
      id_producto_primario: "prod-a",
      estado: "pendiente_cierre",
      sobrante_kg: "0.8",
      kilos_secundario: "17",
    } as never,
  ],
  ordenes: [
    {
      idOrdenTrabajo: "ord-1",
      tipoFlujo: "a_procesamiento",
      idUbicacionDestino: "u-proc-1",
      observaciones: "solicitudProcesamiento:sol-1",
    } as never,
  ],
  warehouseRows: [
    {
      id_ubicacion: "u-proc-1",
      id_producto: "prod-a",
      cantidad: "10",
    } as never,
  ],
};

describe("estado-bodega-procesamiento-slot", () => {
  it("resuelve resultado por ubicación destino de OT a_procesamiento", () => {
    const map = buildResultadoByUbicacionProcesamiento({
      ...zonaParams,
      solicitudesOperador: [
        {
          ...zonaParams.solicitudesOperador[0]!,
          estado: "en_proceso",
        },
      ],
      solicitudesDb: [
        {
          ...zonaParams.solicitudesDb[0]!,
          estado: "en_proceso",
          sobrante_kg: null,
        } as never,
      ],
    });

    expect(map.get("u-proc-1")).toBe("Secundario B");
  });

  it("incluye sobrante kg cuando la solicitud lo tiene", () => {
    const map = buildProcesamientoEnriquecimientoByUbicacion(zonaParams);

    expect(map.get("u-proc-1")).toMatchObject({
      resultadoNombre: "Secundario B",
      sobranteKg: 0.8,
      unidadesSecundario: 17,
    });
  });

  it("en pendiente_cierre muestra dos cajas: sobrante primario y resultado", () => {
    const layout = applyProcesamientoZonaLayout(baseLayout, zonaParams);
    const slots = layout.sections[0]?.slots ?? [];

    expect(slots[0]?.visual).toBe("ocupada_primario");
    expect(slots[0]?.detalle?.rolProcesamiento).toBe("sobrante");
    expect(slots[0]?.detalle?.productoNombre).toBe("Primario A");

    expect(slots[1]?.visual).toBe("ocupada_procesado");
    expect(slots[1]?.detalle?.rolProcesamiento).toBe("procesado");
    expect(slots[1]?.detalle?.productoNombre).toBe("Secundario B");
    expect(slots[1]?.detalle?.cantidad).toContain("17");
  });

  it("sin sobrante solo muestra la caja del resultado procesado", () => {
    const layout = applyProcesamientoZonaLayout(baseLayout, {
      ...zonaParams,
      solicitudesDb: [
        {
          ...zonaParams.solicitudesDb[0]!,
          sobrante_kg: "0",
        } as never,
      ],
    });
    const occupied = (layout.sections[0]?.slots ?? []).filter(
      (slot) => slot.visual !== "vacia",
    );

    expect(occupied).toHaveLength(1);
    expect(occupied[0]?.detalle?.rolProcesamiento).toBe("procesado");
  });
});
