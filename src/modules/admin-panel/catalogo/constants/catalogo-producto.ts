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

export const CATALOGO_ESTADO_BUEN = "BUEN ESTADO" as const;
export const CATALOGO_ESTADO_NO_DISPONIBLE = "NO DISPONIBLE" as const;
export const CATALOGO_ESTADO_DRAFT = "draft" as const;

export const CATALOGO_ESTADO_DEFAULT = CATALOGO_ESTADO_BUEN;

export const CATALOGO_ESTADO_OPTIONS = [
  { value: CATALOGO_ESTADO_BUEN, label: "Buen estado" },
  { value: CATALOGO_ESTADO_NO_DISPONIBLE, label: "No disponible" },
  { value: CATALOGO_ESTADO_DRAFT, label: "Borrador" },
] as const;

export function resolveCatalogoEstadoOptions(
  currentValue?: string,
): { value: string; label: string }[] {
  const normalized = currentValue?.trim();
  const base = CATALOGO_ESTADO_OPTIONS.map((option) => ({ ...option }));
  if (!normalized) return base;
  if (base.some((option) => option.value === normalized)) return base;
  return [{ value: normalized, label: normalized }, ...base];
}

export const CATALOGO_CATEGORIA_OPTIONS = [
  { value: "CARNICOS", label: "Cárnicos" },
  { value: "PESCADOS", label: "Pescados" },
  { value: "AVES", label: "Aves" },
  { value: "EMBUTIDOS", label: "Embutidos" },
  { value: "MARISCOS", label: "Mariscos" },
  { value: "LACTEOS", label: "Lácteos" },
  { value: "CONGELADOS", label: "Congelados" },
  { value: "GENERAL", label: "General" },
] as const;

export interface CatalogoUnidadVisualizacionOption {
  value: string;
  label: string;
  grupo: string;
  unidadMedida: string;
}

export const CATALOGO_UNIDAD_VISUALIZACION_DEFAULT = "cantidad" as const;

export const CATALOGO_UNIDAD_VISUALIZACION_LIST: CatalogoUnidadVisualizacionOption[] =
  [
    { value: "cantidad", label: "Cantidad (unidad)", grupo: "Cantidad", unidadMedida: "und" },
    { value: "und", label: "Unidad", grupo: "Cantidad", unidadMedida: "und" },
    { value: "pieza", label: "Pieza", grupo: "Cantidad", unidadMedida: "und" },
    { value: "par", label: "Par", grupo: "Cantidad", unidadMedida: "und" },
    { value: "docena", label: "Docena", grupo: "Cantidad", unidadMedida: "und" },
    { value: "caja", label: "Caja", grupo: "Empaque", unidadMedida: "und" },
    { value: "paquete", label: "Paquete", grupo: "Empaque", unidadMedida: "und" },
    { value: "bolsa", label: "Bolsa", grupo: "Empaque", unidadMedida: "und" },
    { value: "bandeja", label: "Bandeja", grupo: "Empaque", unidadMedida: "und" },
    { value: "pallet", label: "Pallet", grupo: "Empaque", unidadMedida: "und" },
    { value: "bulto", label: "Bulto", grupo: "Empaque", unidadMedida: "und" },
    { value: "peso", label: "Peso", grupo: "Peso", unidadMedida: "g" },
    { value: "g", label: "Gramos (g)", grupo: "Peso", unidadMedida: "g" },
    { value: "kg", label: "Kilogramos (kg)", grupo: "Peso", unidadMedida: "g" },
    { value: "lb", label: "Libras (lb)", grupo: "Peso", unidadMedida: "g" },
    { value: "oz", label: "Onzas (oz)", grupo: "Peso", unidadMedida: "g" },
    { value: "ton", label: "Toneladas (t)", grupo: "Peso", unidadMedida: "g" },
    { value: "ml", label: "Mililitros (ml)", grupo: "Volumen", unidadMedida: "und" },
    { value: "l", label: "Litros (l)", grupo: "Volumen", unidadMedida: "und" },
    { value: "gal", label: "Galones (gal)", grupo: "Volumen", unidadMedida: "und" },
    { value: "m", label: "Metros (m)", grupo: "Longitud", unidadMedida: "und" },
    { value: "cm", label: "Centímetros (cm)", grupo: "Longitud", unidadMedida: "und" },
  ];

export const CATALOGO_UNIDAD_VISUALIZACION_OPTIONS =
  CATALOGO_UNIDAD_VISUALIZACION_LIST.map(({ value, label }) => ({
    value,
    label,
  }));

export function getCatalogoUnidadVisualizacionLabel(value: string): string {
  return (
    CATALOGO_UNIDAD_VISUALIZACION_LIST.find((item) => item.value === value)
      ?.label ?? value
  );
}

export function resolveCatalogoUnidadMedida(unidadVisualizacion: string): string {
  const entry = CATALOGO_UNIDAD_VISUALIZACION_LIST.find(
    (item) => item.value === unidadVisualizacion,
  );
  if (entry) return entry.unidadMedida;
  return unidadVisualizacion === "peso" ? "g" : "und";
}

export function resolveCatalogoSelectOptions(
  base: readonly { value: string; label: string }[],
  currentValue?: string,
): { value: string; label: string }[] {
  const normalized = currentValue?.trim();
  const options = base.map((option) => ({ ...option }));
  if (!normalized) return options;
  if (options.some((option) => option.value === normalized)) return options;
  return [{ value: normalized, label: normalized }, ...options];
}

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
