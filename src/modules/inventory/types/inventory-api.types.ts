export interface LockWarehouseStateApiInput {
  codigoCuenta: string;
  idBodega: string;
  expectedVersion?: number;
}

export interface WarehouseStateApiRow {
  idWarehouseState: string;
  codigoCuenta: string;
  idBodega: string;
  idUbicacion: string;
  idProducto: string;
  idLote: string | null;
  cantidad: string;
  cantidadReservada: string;
  temperatura: string | null;
  lockedBy: string | null;
  lockedAt: string | null;
  version: number;
  updatedAt: string;
}
