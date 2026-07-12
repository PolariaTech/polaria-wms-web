import type {
  EstadoBodegaSectionId,
  EstadoBodegaSlotVisual,
} from "../constants/estado-bodega-layout";

export interface EstadoBodegaSlotDetalleView {
  productoNombre: string;
  idPaquete: string | null;
  cliente: string | null;
  cantidad: string;
  posicion: string | null;
  temperatura: string | null;
  ordenCompraCodigo: string | null;
}

export interface EstadoBodegaSlot {
  slotNumber: number;
  idUbicacion: string | null;
  codigo: string | null;
  visual: EstadoBodegaSlotVisual;
  /** @deprecated Preferir `detalle.productoNombre`. */
  productoLabel: string | null;
  detalle: EstadoBodegaSlotDetalleView | null;
}

export interface EstadoBodegaSectionView {
  id: EstadoBodegaSectionId;
  title: string;
  cols: number;
  rows: number;
  capacity: number;
  occupiedCount: number;
  alertCount: number;
  pendingTaskCount: number;
  emptyHint?: string;
  showOccupancyBadge?: boolean;
  slots: EstadoBodegaSlot[];
}

export interface EstadoBodegaLayoutView {
  sections: EstadoBodegaSectionView[];
}

export interface UbicacionEstadoBodegaDbRow {
  id_ubicacion: string;
  codigo: string;
  estado_slot: string;
  tipo_ubicacion:
    | {
        codigo: string;
        es_recepcion: boolean;
        es_almacenamiento: boolean;
        es_picking: boolean;
      }
    | {
        codigo: string;
        es_recepcion: boolean;
        es_almacenamiento: boolean;
        es_picking: boolean;
      }[]
    | null;
}
