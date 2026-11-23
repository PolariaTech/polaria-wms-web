import type { CatalogoProductoMetadatos } from "../constants/catalogo-producto";

export interface CatalogoProductoListRow {
  idProducto: string;
  idNum: number;
  codigo: string;
  titulo: string;
  slug: string;
  descripcion: string;
  proveedor: string;
  categoria: string;
  tipo: string;
  /** Etiqueta legible de `metadatos_catalogo.tipo_producto` (Producto / Servicio). */
  tipoProducto: string;
  /** Código numérico crudo; null si no viene en metadatos. */
  tipoProductoCodigo: number | null;
  etiquetas: string;
  publicado: string;
  estado: string;
  sku: string;
  codigoBarras: string;
  nombreOpcion1: string;
  valorOpcion1: string;
  vinculado: string;
  unidad: string;
  impuesto: string;
  trackerInventario: string;
  stock: string;
  estaActivo: boolean;
}

export interface ProductoDbRow {
  id_producto: string;
  sku: string;
  descripcion: string;
  codigo_almacen: string | null;
  es_primario: boolean;
  es_secundario: boolean;
  unidad_visualizacion: string;
  unidad_medida: string | null;
  id_producto_primario: string | null;
  esta_activo?: boolean | null;
  metadatos_catalogo?: unknown;
}

export interface CreateCatalogoProductoInput {
  codigoCuenta: string;
  sku: string;
  titulo: string;
  unidadMedida: string;
  unidadVisualizacion: string;
  esPrimario: boolean;
  esSecundario: boolean;
  idProductoPrimario?: string | null;
  reglaConversionCantidadPrimario?: number | null;
  reglaConversionUnidadesSecundario?: number | null;
  mermaPct?: number | null;
  metadatos: CatalogoProductoMetadatos;
}

export interface ListCatalogoProductosParams {
  codigoCuenta: string;
  search?: string;
  limit?: number;
  /** true (default) solo activos; false incluye deshabilitados (tabla admin). */
  soloActivos?: boolean;
  /**
   * true (default) solo mercancía vendible (`tipo_producto === 1`).
   * Excluye servicios (`3`) y filas sin código.
   */
  soloMercancia?: boolean;
}

export interface ListPreciosProductoVigentesParams {
  codigoCuenta: string;
  idProductos: readonly string[];
}

export interface InsertPrecioProductoVigenteParams {
  codigoCuenta: string;
  idProducto: string;
  precio: number;
  moneda?: string;
}

export interface ProductoPrimarioOption {
  idProducto: string;
  label: string;
  titulo: string;
  codigo: string;
  sku: string;
  categoria: string;
  proveedor: string;
}

export interface ListProductosPrimariosCatalogoParams {
  codigoCuenta: string;
  limit?: number;
}

export interface UpdateCatalogoProductoInput {
  codigoCuenta: string;
  idProducto: string;
  sku: string;
  titulo: string;
  unidadMedida: string;
  unidadVisualizacion: string;
  esPrimario: boolean;
  esSecundario: boolean;
  metadatos: CatalogoProductoMetadatos;
}

export interface CatalogoImportResult {
  imported: number;
  errors: string[];
  skipped: number;
}