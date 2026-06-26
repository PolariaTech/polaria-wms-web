import {
  DEFAULT_LIST_LIMIT,
  requireCodigoCuenta,
  runDomainMutation,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/domain-service-error";
import { generateCodigoCuentaFromNombre } from "@/lib/generate-codigo-cuenta";
import {
  CATALOGO_TIPO_PRIMARIO,
  CATALOGO_TIPO_SECUNDARIO,
  parseCatalogoMetadatos,
  type CatalogoProductoMetadatos,
} from "../constants/catalogo-producto";

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
  etiquetas: string;
  publicado: string;
  estado: string;
  sku: string;
  codigoBarras: string;
  nombreOpcion1: string;
  valorOpcion1: string;
  vinculado: string;
  precio: string;
  impuesto: string;
  trackerInventario: string;
  stock: string;
}

interface ProductoDbRow {
  id_producto: string;
  sku: string;
  descripcion: string;
  codigo_almacen: string | null;
  es_primario: boolean;
  es_secundario: boolean;
  unidad_visualizacion: string;
  id_producto_primario: string | null;
  metadatos_catalogo: unknown;
}

const PRODUCTO_LIST_COLUMNS =
  "id_producto,sku,descripcion,codigo_almacen,es_primario,es_secundario,unidad_visualizacion,id_producto_primario,metadatos_catalogo";

function resolveTipo(row: ProductoDbRow, meta: CatalogoProductoMetadatos): string {
  if (meta.tipo?.trim()) return meta.tipo.trim();
  if (row.es_secundario) return CATALOGO_TIPO_SECUNDARIO;
  if (row.es_primario) return CATALOGO_TIPO_PRIMARIO;
  return "—";
}

function mapProductoRow(row: ProductoDbRow, index: number): CatalogoProductoListRow {
  const meta = parseCatalogoMetadatos(row.metadatos_catalogo);
  const titulo = meta.titulo?.trim() || row.descripcion.trim() || "—";

  return {
    idProducto: row.id_producto,
    idNum: index + 1,
    codigo: row.codigo_almacen?.trim() || row.sku || "—",
    titulo,
    slug: meta.slug?.trim() || "—",
    descripcion: meta.descripcion?.trim() || row.descripcion || "—",
    proveedor: meta.proveedor?.trim() || "—",
    categoria: meta.categoria?.trim() || "—",
    tipo: resolveTipo(row, meta),
    etiquetas: meta.etiquetas?.trim() || "—",
    publicado: meta.publicadoTienda ? "Sí" : "No",
    estado: meta.estado?.trim() || "—",
    sku: row.sku || "—",
    codigoBarras: meta.codigoBarras?.trim() || "—",
    nombreOpcion1: meta.nombreOpcion1?.trim() || "—",
    valorOpcion1: meta.valorOpcion1?.trim() || "—",
    vinculado:
      meta.incluidoPrimarioLabel?.trim() ||
      meta.vinculadoOpcion1?.trim() ||
      "—",
    precio: meta.precio?.trim() || "—",
    impuesto: meta.cobrarImpuesto ? "Sí" : "No",
    trackerInventario: meta.rastreadorInventario?.trim() || "—",
    stock: meta.cantidadInventario?.trim() || "0",
  };
}

export interface ListCatalogoProductosParams {
  codigoCuenta: string;
  search?: string;
  limit?: number;
}

/** Lista productos del catálogo de la cuenta tenant. */
export async function listCatalogoProductosAdmin(
  params: ListCatalogoProductosParams,
): Promise<CatalogoProductoListRow[]> {
  const codigoCuenta = requireCodigoCuenta(params.codigoCuenta);
  const limit = params.limit ?? DEFAULT_LIST_LIMIT;
  const search = params.search?.trim().toLowerCase() ?? "";

  const rows = await runDomainQuery<ProductoDbRow[]>((client) => {
    const query = client
      .from("producto")
      .select(PRODUCTO_LIST_COLUMNS)
      .eq("codigo_cuenta", codigoCuenta)
      .eq("esta_activo", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    return query as unknown as Promise<{
      data: ProductoDbRow[] | null;
      error: { message: string } | null;
    }>;
  });

  const mapped = rows.map((row, index) => mapProductoRow(row, index));

  if (!search) return mapped;

  return mapped.filter((row) => {
    const haystack = [
      row.titulo,
      row.codigo,
      row.sku,
      row.proveedor,
      row.categoria,
      row.slug,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(search);
  });
}

export interface ProductoPrimarioOption {
  idProducto: string;
  label: string;
}

export async function listProductosPrimariosCatalogo(
  codigoCuenta: string,
): Promise<ProductoPrimarioOption[]> {
  const cuenta = requireCodigoCuenta(codigoCuenta);

  const rows = await runDomainQuery<
    { id_producto: string; descripcion: string; sku: string; metadatos_catalogo: unknown }[]
  >((client) => {
    const query = client
      .from("producto")
      .select("id_producto,descripcion,sku,metadatos_catalogo")
      .eq("codigo_cuenta", cuenta)
      .eq("esta_activo", true)
      .eq("es_primario", true)
      .order("descripcion", { ascending: true })
      .limit(DEFAULT_LIST_LIMIT);

    return query as unknown as Promise<{
      data:
        | {
            id_producto: string;
            descripcion: string;
            sku: string;
            metadatos_catalogo: unknown;
          }[]
        | null;
      error: { message: string } | null;
    }>;
  });

  return rows.map((row) => {
    const meta = parseCatalogoMetadatos(row.metadatos_catalogo);
    const titulo = meta.titulo?.trim() || row.descripcion.trim();
    return {
      idProducto: row.id_producto,
      label: titulo ? `${titulo} (${row.sku})` : row.sku,
    };
  });
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

async function insertCatalogoProducto(
  input: CreateCatalogoProductoInput,
): Promise<CatalogoProductoListRow> {
  const codigoCuenta = requireCodigoCuenta(input.codigoCuenta);
  const sku = input.sku.trim();
  const titulo = input.titulo.trim();

  if (!sku) {
    throw new DomainServiceError("El SKU es obligatorio.", "INVALID_ARGUMENT");
  }
  if (!titulo) {
    throw new DomainServiceError("El título es obligatorio.", "INVALID_ARGUMENT");
  }

  const codigo = generateCodigoCuentaFromNombre(titulo) || sku;

  const inserted = await runDomainMutation<ProductoDbRow>((client) => {
    const query = client
      .from("producto")
      .insert({
        codigo_cuenta: codigoCuenta,
        sku,
        descripcion: titulo,
        codigo_almacen: codigo,
        unidad_medida: input.unidadMedida,
        unidad_visualizacion: input.unidadVisualizacion,
        es_primario: input.esPrimario,
        es_secundario: input.esSecundario,
        id_producto_primario: input.idProductoPrimario ?? null,
        regla_conversion_cantidad_primario:
          input.reglaConversionCantidadPrimario ?? null,
        regla_conversion_unidades_secundario:
          input.reglaConversionUnidadesSecundario ?? null,
        merma_pct: input.mermaPct ?? null,
        metadatos_catalogo: input.metadatos,
        esta_activo: true,
      })
      .select(PRODUCTO_LIST_COLUMNS)
      .single();

    return query as unknown as Promise<{
      data: ProductoDbRow | null;
      error: { message: string } | null;
    }>;
  });

  return mapProductoRow(inserted, 0);
}

/** Crea un producto primario del catálogo. */
export async function createCatalogoProductoPrimario(
  input: Omit<CreateCatalogoProductoInput, "esPrimario" | "esSecundario">,
): Promise<CatalogoProductoListRow> {
  return insertCatalogoProducto({
    ...input,
    esPrimario: true,
    esSecundario: false,
    idProductoPrimario: null,
  });
}

/** Crea un producto secundario del catálogo. */
export async function createCatalogoProductoSecundario(
  input: CreateCatalogoProductoInput,
): Promise<CatalogoProductoListRow> {
  if (!input.idProductoPrimario) {
    throw new DomainServiceError(
      "Selecciona el producto primario incluido.",
      "INVALID_ARGUMENT",
    );
  }

  return insertCatalogoProducto({
    ...input,
    esPrimario: false,
    esSecundario: true,
  });
}
