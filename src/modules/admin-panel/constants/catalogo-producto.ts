/** Metadatos extendidos del catálogo (columna `metadatos_catalogo` en `producto`). */
export interface CatalogoProductoMetadatos {
  titulo?: string;
  slug?: string;
  descripcion?: string;
  proveedor?: string;
  categoria?: string;
  tipo?: string;
  etiquetas?: string;
  publicadoTienda?: boolean;
  estado?: string;
  codigoBarras?: string;
  nombreOpcion1?: string;
  valorOpcion1?: string;
  vinculadoOpcion1?: string;
  precio?: string;
  cobrarImpuesto?: boolean;
  rastreadorInventario?: string;
  cantidadInventario?: string;
  continuarSinStock?: boolean;
  valorPesoG?: string;
  incluidoPrimarioId?: string;
  incluidoPrimarioLabel?: string;
  requiereEnvio?: boolean;
  servicioLogistica?: string;
  incluidoInternacional?: boolean;
  urlImagenProducto?: string;
  posicionImagen?: string;
  textoAltImagen?: string;
  urlImagenVariante?: string;
  tarjetaRegalo?: boolean;
  tituloSeo?: string;
  descripcionSeo?: string;
  googleShoppingCategoria?: string;
  metacampos?: string;
  basePrimario?: string;
  gramosPorUnidad?: string;
  mermaPct?: string;
}

export const CATALOGO_ESTADO_DEFAULT = "draft" as const;

export const CATALOGO_UNIDAD_VISUALIZACION_OPTIONS = [
  { value: "cantidad", label: "Cantidad" },
  { value: "peso", label: "Peso" },
] as const;

export const CATALOGO_TIPO_PRIMARIO = "Primario" as const;
export const CATALOGO_TIPO_SECUNDARIO = "Secundario" as const;

export const CATALOGO_TIPO_OPTIONS = [
  { value: CATALOGO_TIPO_PRIMARIO, label: CATALOGO_TIPO_PRIMARIO },
  { value: CATALOGO_TIPO_SECUNDARIO, label: CATALOGO_TIPO_SECUNDARIO },
] as const;

export function createEmptyCatalogoMetadatos(): CatalogoProductoMetadatos {
  return {
    estado: CATALOGO_ESTADO_DEFAULT,
    publicadoTienda: false,
    cobrarImpuesto: false,
    continuarSinStock: false,
    requiereEnvio: true,
    incluidoInternacional: false,
    tarjetaRegalo: false,
    cantidadInventario: "0",
    precio: "0",
    mermaPct: "0",
  };
}

/** Normaliza metadatos desde JSON de Supabase. */
export function parseCatalogoMetadatos(
  value: unknown,
): CatalogoProductoMetadatos {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as CatalogoProductoMetadatos;
}
