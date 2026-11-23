import type { UbicacionEstadoBodegaDbRow } from "@/modules/warehouses/estado-bodega/types/estado-bodega.types";

export interface JefeBodegaTransferenciaModalProps {
  open: boolean;
  onClose: () => void;
  codigoCuenta: string | null;
  idBodega: string | null;
  ubicacionesAlmacen: UbicacionEstadoBodegaDbRow[];
  ubicacionesProcesamiento: UbicacionEstadoBodegaDbRow[];
  onCreated?: () => void;
}

export type TransferenciaPickerKind = "origen" | "destino" | null;
export type OrigenZona = "almacenamiento" | "procesamiento";
export type OrigenRol =
  | "normal"
  | "sobrante"
  | "procesado"
  | "en_proceso"
  | "stock";

export interface OrigenMeta {
  idUbicacion: string;
  zona: OrigenZona;
  rol: OrigenRol;
  idSolicitud: string | null;
  idProducto: string | null;
  cantidad: number | null;
}
