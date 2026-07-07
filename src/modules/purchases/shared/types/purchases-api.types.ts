import type { EstadoOrdenCompra, EstadoSolicitudCompra } from "./purchases.types";

export interface SolicitudCompraLineaInput {
  idProducto: string;
  cantidad: number;
}

export interface CreateSolicitudCompraApiInput {
  codigoCuenta: string;
  idBodega: string;
  idProveedor?: string | null;
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

export interface OrdenCompraLineaApiInput {
  idProducto: string;
  cantidad: number;
}

export interface CreateOrdenCompraApiInput {
  codigoCuenta: string;
  idBodega: string;
  idProveedor: string;
  observaciones?: string | null;
  fechaEntregaEstimada?: string | null;
  lineas: OrdenCompraLineaApiInput[];
}

export interface RecepcionLineaApiInput {
  idLineaOrdenCompra: string;
  cantidadRecibida: number;
  temperaturaRegistrada?: number;
}

export interface CerrarRecepcionCompraApiInput {
  idOrdenCompra: string;
  codigoCuenta: string;
  idBodega: string;
  lineas: RecepcionLineaApiInput[];
  idUbicacionIngreso?: string;
  notas?: string | null;
}

export interface RecepcionCompraApiRow {
  idRecepcion: string;
  codigoCuenta: string;
  idBodega: string;
  idOrdenCompra: string;
  sinDiferencias: boolean;
  notas: string | null;
  cerradaAt: string;
  estadoOrdenCompra: EstadoOrdenCompra;
}
