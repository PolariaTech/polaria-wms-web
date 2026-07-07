export interface WarehouseStateRow {
  id_warehouse_state: string;
  codigo_cuenta: string;
  id_bodega: string;
  id_ubicacion: string;
  id_producto: string;
  id_lote: string | null;
  cantidad: string;
  cantidad_reservada: string;
  temperatura: string | null;
  locked_by: string | null;
  locked_at: string | null;
  version: number;
  updated_at: string;
}

export interface WarehouseStateListParams {
  idBodega: string;
  codigoCuenta?: string | null;
  limit?: number;
}
