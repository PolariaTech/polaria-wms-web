export type EstadoGuiaEnvio =
  | "generada"
  | "asignada"
  | "en_transito"
  | "entregada"
  | "anulada";

export type EstadoViajeTransporte =
  | "programado"
  | "en_ruta"
  | "entregado"
  | "cancelado";

export type TipoEvidenciaTransporte = "foto" | "firma";

export interface GuiaEnvioRow {
  id_guia: string;
  codigo_cuenta: string;
  id_viaje: string;
  id_orden_venta: string | null;
  codigo: string;
  destino: string;
  estado: EstadoGuiaEnvio;
  created_at: string;
  updated_at: string;
}

export interface EvidenciaTransporteRow {
  id_evidencia: string;
  id_guia: string;
  id_linea_orden_venta: string | null;
  tipo: TipoEvidenciaTransporte;
  url_cloudinary: string;
  cantidad_entregada: string | null;
  incidencia: string | null;
  entrega_conforme: boolean | null;
  created_at: string;
}

/** Fila de la tabla de viajes del rol transportista (referencia frio). */
export interface ViajeEntregaRow {
  idViaje: string;
  codigoViaje: string;
  idGuia: string | null;
  idOrdenVenta: string | null;
  codigoVenta: string;
  clienteNombre: string;
  kgVenta: number;
  estado: EstadoViajeTransporte;
}

export interface TransportListParams {
  codigoCuenta: string;
  idBodega?: string | null;
  idGuia?: string | null;
  limit?: number;
}
