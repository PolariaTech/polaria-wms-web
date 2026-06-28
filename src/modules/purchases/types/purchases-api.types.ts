import type { EstadoOrdenCompra, EstadoSolicitudCompra } from "./purchases.types";

export interface SolicitudCompraLineaInput {
  idProducto: string;
  cantidad: number;
}

export interface CreateSolicitudCompraApiInput {
  idProveedor: string;
  idBodega: string;
  observaciones?: string | null;
  lineas: SolicitudCompraLineaInput[];
}

export interface SolicitudCompraApiRow {
  idSolicitudCompra: string;
  codigo: string;
  estado: EstadoSolicitudCompra;
  idProveedor: string | null;
  idBodega: string;
  idOrdenCompra: string | null;
}

export interface OrdenCompraApiRow {
  idOrdenCompra: string;
  codigo: string;
  estado: EstadoOrdenCompra;
  idProveedor: string;
  idBodega: string;
  idSolicitudCompra: string | null;
}
