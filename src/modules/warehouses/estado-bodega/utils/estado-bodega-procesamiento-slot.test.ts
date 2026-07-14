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
            lockedBy: null,
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

  it("oculta sobrante si el primario ya no está en procesamiento", () => {
    const layout = applyProcesamientoZonaLayout(baseLayout, {
      ...zonaParams,
      warehouseRows: [
        {
          id_ubicacion: "u-proc-1",
          id_producto: "prod-secundario",
          cantidad: "17",
        } as never,
      ],
    });
    const occupied = (layout.sections[0]?.slots ?? []).filter(
      (slot) => slot.visual !== "vacia",
    );

    expect(occupied).toHaveLength(1);
    expect(occupied[0]?.detalle?.rolProcesamiento).toBe("procesado");
    expect(occupied[0]?.detalle?.productoNombre).toBe("Secundario B");
  });

  it("oculta sobrante si la OT de desperdicio ya está completada", () => {
    const layout = applyProcesamientoZonaLayout(baseLayout, {
      ...zonaParams,
      ordenes: [
        ...zonaParams.ordenes,
        {
          idOrdenTrabajo: "ord-desp",
          estado: "completada",
          tipoFlujo: "bodega_a_bodega",
          observaciones:
            "solicitudProcesamiento:sol-1|rolDevolucion:desperdicio",
        } as never,
      ],
    });
    const occupied = (layout.sections[0]?.slots ?? []).filter(
      (slot) => slot.visual !== "vacia",
    );

    expect(occupied).toHaveLength(1);
    expect(occupied[0]?.detalle?.rolProcesamiento).toBe("procesado");
  });

  it("mantiene Resultado en pendiente_cierre aunque el slot físico quedó vacío", () => {
    const emptyLayout: EstadoBodegaLayoutView = {
      sections: [
        {
          ...baseLayout.sections[0]!,
          occupiedCount: 0,
          slots: [
            {
              slotNumber: 1,
              idUbicacion: "u-proc-1",
              codigo: "PROC-01",
              visual: "vacia",
              productoLabel: null,
              detalle: null,
            },
            ...baseLayout.sections[0]!.slots.slice(1),
          ],
        },
      ],
    };

    const layout = applyProcesamientoZonaLayout(emptyLayout, {
      ...zonaParams,
      warehouseRows: [],
    });
    const occupied = (layout.sections[0]?.slots ?? []).filter(
      (slot) => slot.visual !== "vacia",
    );

    expect(occupied).toHaveLength(1);
    expect(occupied[0]?.detalle?.rolProcesamiento).toBe("procesado");
    expect(occupied[0]?.detalle?.productoNombre).toBe("Secundario B");
  });

  it("oculta Resultado si la OT de procesado ya está completada", () => {
    const emptyLayout: EstadoBodegaLayoutView = {
      sections: [
        {
          ...baseLayout.sections[0]!,
          occupiedCount: 0,
          slots: [
            {
              slotNumber: 1,
              idUbicacion: "u-proc-1",
              codigo: "PROC-01",
              visual: "vacia",
              productoLabel: null,
              detalle: null,
            },
            ...baseLayout.sections[0]!.slots.slice(1),
          ],
        },
      ],
    };

    const layout = applyProcesamientoZonaLayout(emptyLayout, {
      ...zonaParams,
      warehouseRows: [],
      ordenes: [
        ...zonaParams.ordenes,
        {
          idOrdenTrabajo: "ord-res",
          estado: "completada",
          tipoFlujo: "bodega_a_bodega",
          observaciones:
            "solicitudProcesamiento:sol-1|rolDevolucion:procesado",
        } as never,
        {
          idOrdenTrabajo: "ord-desp",
          estado: "completada",
          tipoFlujo: "bodega_a_bodega",
          observaciones:
            "solicitudProcesamiento:sol-1|rolDevolucion:desperdicio",
        } as never,
      ],
    });
    const occupied = (layout.sections[0]?.slots ?? []).filter(
      (slot) => slot.visual !== "vacia",
    );

    expect(occupied).toHaveLength(0);
  });

  it("en almacenamiento marca resultado (secundario) distinto al primario", () => {
    const layoutWithAlmacen: EstadoBodegaLayoutView = {
      sections: [
        ...baseLayout.sections,
        {
          id: "almacenamiento",
          title: "Almacenamiento",
          cols: 4,
          rows: 3,
          capacity: 12,
          occupiedCount: 2,
          alertCount: 0,
          pendingTaskCount: 0,
          slots: [
            {
              slotNumber: 1,
              idUbicacion: "u-slot-1",
              codigo: "SLOT-001",
              visual: "ocupada_primario",
              productoLabel: "Secundario B",
              detalle: {
                productoNombre: "Secundario B",
                idPaquete: null,
                cliente: null,
                cantidad: "17 ud.",
                posicion: "SLOT-001",
                temperatura: "0 °C",
                ordenCompraCodigo: null,
                lockedBy: null,
              },
            },
            {
              slotNumber: 2,
              idUbicacion: "u-slot-2",
              codigo: "SLOT-002",
              visual: "ocupada_primario",
              productoLabel: "Primario A",
              detalle: {
                productoNombre: "Primario A",
                idPaquete: "OC-001",
                cliente: null,
                cantidad: "40 kg",
                posicion: "SLOT-002",
                temperatura: "0 °C",
                ordenCompraCodigo: "OC-001",
                lockedBy: null,
              },
            },
          ],
        },
      ],
    };

    const layout = applyProcesamientoZonaLayout(layoutWithAlmacen, {
      ...zonaParams,
      solicitudesDb: [
        {
          ...zonaParams.solicitudesDb[0]!,
          id_producto_secundario: "prod-b",
        } as never,
      ],
      warehouseRows: [
        {
          id_ubicacion: "u-slot-1",
          id_producto: "prod-b",
          cantidad: "17",
        } as never,
        {
          id_ubicacion: "u-slot-2",
          id_producto: "prod-a",
          cantidad: "40",
        } as never,
      ],
    });

    const almacen = layout.sections.find((s) => s.id === "almacenamiento");
    expect(almacen?.slots[0]?.visual).toBe("ocupada_procesado");
    expect(almacen?.slots[0]?.detalle?.rolProcesamiento).toBeUndefined();
    expect(almacen?.slots[1]?.visual).toBe("ocupada_primario");
    expect(almacen?.slots[1]?.detalle?.rolProcesamiento).toBeUndefined();
  });
});
