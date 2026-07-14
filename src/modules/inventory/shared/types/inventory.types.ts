export interface WarehouseStateProductoRel {
  id_producto: string;
  sku: string | null;
  descripcion: string | null;
  metadatos_catalogo?: unknown;
}

export interface WarehouseStateClienteRel {
  id_cliente: string;
  nombre: string | null;
  codigo: string | null;
}

export interface WarehouseStateProveedorRel {
  id_proveedor: string;
  razon_social: string | null;
  codigo: string | null;
}

export interface WarehouseStateOrdenCompraRel {
  id_orden_compra: string;
  codigo: string | null;
}

export interface WarehouseStateOrdenCompraLineaRel {
  id_linea_orden_compra: string;
  id_orden_compra: string;
  orden_compra:
    | WarehouseStateOrdenCompraRel
    | WarehouseStateOrdenCompraRel[]
    | null;
}

export interface WarehouseStateLoteRel {
  id_lote: string;
  codigo_lote: string | null;
  id_cliente: string | null;
  id_proveedor: string | null;
  id_linea_orden_compra: string | null;
  cliente: WarehouseStateClienteRel | WarehouseStateClienteRel[] | null;
  proveedor: WarehouseStateProveedorRel | WarehouseStateProveedorRel[] | null;
  orden_compra_linea:
    | WarehouseStateOrdenCompraLineaRel
    | WarehouseStateOrdenCompraLineaRel[]
    | null;
}

export interface WarehouseStateCuentaRel {
  codigo_cuenta: string;
  nombre_comercial: string | null;
}

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
  /** Presente en listados enriquecidos; ausente en eventos Realtime crudos. */
  producto?: WarehouseStateProductoRel | WarehouseStateProductoRel[] | null;
  lote?: WarehouseStateLoteRel | WarehouseStateLoteRel[] | null;
  cuenta?: WarehouseStateCuentaRel | WarehouseStateCuentaRel[] | null;
}

export interface WarehouseStateListParams {
  idBodega: string;
  codigoCuenta?: string | null;
  idUbicacion?: string | null;
  limit?: number;
}
