export type EstadoOrdenVenta =
  | "borrador"
  | "confirmada"
  | "en_preparacion"
  | "parcialmente_despachada"
  | "despachada"
  | "cerrada"
  | "cancelada";

export interface OrdenVentaRow {
  id_orden_venta: string;
  codigo_cuenta: string;
  id_bodega: string;
  id_cliente: string;
  id_comprador: string | null;
  id_planta: string | null;
  id_creador: string | null;
  id_bodega_destino: string | null;
  codigo: string;
  estado: EstadoOrdenVenta;
  fecha_pedido: string;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
}
