export type FlujoOrdenTrabajoApi =
  | "a_bodega"
  | "a_salida"
  | "revisar"
  | "bodega_a_bodega";

export interface OrdenTrabajoApiRow {
  idOrdenTrabajo: string;
  codigoCuenta: string;
  idBodega: string;
  codigo: string;
  estado: string;
  tipo: string;
  tipoFlujo: FlujoOrdenTrabajoApi | null;
  idAsignado: string | null;
  idSolicitante: string | null;
  idLote: string | null;
  idUbicacionOrigen: string | null;
  idUbicacionDestino: string | null;
  observaciones: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TareaColaApiRow {
  idTarea: string;
  codigoCuenta: string;
  idBodega: string;
  tipo: string;
  estado: string;
  idAsignado: string | null;
  idOrdenTrabajo: string | null;
  titulo: string | null;
  descripcion: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AlertaOperativaApiRow {
  idAlerta: string;
  codigoCuenta: string;
  idBodega: string;
  tipo: string;
  estado: string;
  titulo: string;
  descripcion: string | null;
  idResponsable: string | null;
  createdAt: string;
}

export interface LlamadaOperativaApiRow {
  idLlamada: string;
  codigoCuenta: string;
  idBodega: string;
  fromRol: string;
  message: string;
  atendida: boolean;
  createdAt: string;
}

export interface BodegaReportesApiResumen {
  ingresos: number;
  salidas: number;
  movimientos: number;
  despachados: number;
  alertas: number;
  mermaKg: number;
  ordenesTrabajoPendientes: number;
  tareasPendientes: number;
  llamadasPendientes: number;
}

export interface TenantBodegaApiParams {
  codigoCuenta: string;
  idBodega: string;
}

export interface CreateOrdenTrabajoApiInput extends TenantBodegaApiParams {
  tipoFlujo: FlujoOrdenTrabajoApi;
  idUbicacionOrigen?: string;
  idUbicacionDestino?: string;
  idLote?: string;
  idProducto?: string;
  cantidad?: number;
  idAsignado?: string;
  observaciones?: string;
}

export interface EjecutarOrdenTrabajoApiInput extends TenantBodegaApiParams {
  idWarehouseState?: string;
  version?: number;
}
