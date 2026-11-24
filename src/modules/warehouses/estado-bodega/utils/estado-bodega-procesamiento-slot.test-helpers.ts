import type { EstadoBodegaLayoutView } from "../types/estado-bodega.types";
import type { ProcesamientoZonaParams } from "./estado-bodega-procesamiento-slot";

export const baseLayout: EstadoBodegaLayoutView = {
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

export const zonaParams = {
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
    },
  ],
  ordenes: [
    {
      idOrdenTrabajo: "ord-1",
      tipoFlujo: "a_procesamiento",
      idUbicacionDestino: "u-proc-1",
      observaciones: "solicitudProcesamiento:sol-1",
    },
  ],
  warehouseRows: [
    {
      id_ubicacion: "u-proc-1",
      id_producto: "prod-a",
      cantidad: "10",
    },
  ],
} as unknown as ProcesamientoZonaParams;
