import {
  DEFAULT_LIST_LIMIT,
  requireCodigoCuenta,
  runDomainMutation,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { generateCodigoCuentaFromNombre } from "@/lib/utils/generate-codigo-cuenta";
import {
  CATALOGO_TIPO_PRIMARIO,
  CATALOGO_TIPO_SECUNDARIO,
  parseCatalogoMetadatos,
  type CatalogoProductoMetadatos,
} from "../constants/catalogo-producto";
import type { CatalogoExcelImportRow } from "../utils/catalogo-excel-import";
import { parseCatalogoSpreadsheetFile } from "../utils/catalogo-excel-import";

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
  metadatos_catalogo?: unknown;
}

const PRODUCTO_LIST_COLUMNS =
  "id_producto,sku,descripcion,codigo_almacen,es_primario,es_secundario,unidad_visualizacion,id_producto_primario";

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

function buildProductoInsertPayload(
  input: CreateCatalogoProductoInput,
  codigoCuenta: string,
  sku: string,
  titulo: string,
  codigo: string,
): Record<string, unknown> {
  return {
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
  };
}

function isMissingMetadatosCatalogoColumn(error: { message?: string } | null): boolean {
  return Boolean(
    error?.message?.includes("metadatos_catalogo") &&
      error.message.includes("does not exist"),
  );
}

async function queryProductosCatalogo<T>(
  buildQuery: (selectColumns: string) => Promise<T[]>,
): Promise<T[]> {
  try {
    return await buildQuery(`${PRODUCTO_LIST_COLUMNS},metadatos_catalogo`);
  } catch (error: unknown) {
    if (
      error instanceof DomainServiceError &&
      isMissingMetadatosCatalogoColumn({ message: error.message })
    ) {
      return buildQuery(PRODUCTO_LIST_COLUMNS);
    }

    throw error;
  }
}

async function insertProductoCatalogo(
  payload: Record<string, unknown>,
): Promise<ProductoDbRow> {
  const insertWithPayload = (body: Record<string, unknown>) =>
    runDomainMutation<ProductoDbRow>((client) => {
      const query = client
        .from("producto")
        .insert(body)
        .select(`${PRODUCTO_LIST_COLUMNS},metadatos_catalogo`)
        .single();

      return query as unknown as Promise<{
        data: ProductoDbRow | null;
        error: { message: string } | null;
      }>;
    });

  try {
    return await insertWithPayload(payload);
  } catch (error: unknown) {
    if (
      error instanceof DomainServiceError &&
      isMissingMetadatosCatalogoColumn({ message: error.message })
    ) {
      const { metadatos_catalogo: _meta, ...payloadWithoutMeta } = payload;
      return runDomainMutation<ProductoDbRow>((client) => {
        const query = client
          .from("producto")
          .insert(payloadWithoutMeta)
          .select(PRODUCTO_LIST_COLUMNS)
          .single();

        return query as unknown as Promise<{
          data: ProductoDbRow | null;
          error: { message: string } | null;
        }>;
      });
    }

    throw error;
  }
}

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

  const rows = await queryProductosCatalogo((selectColumns) =>
    runDomainQuery<ProductoDbRow[]>((client) => {
      const query = client
        .from("producto")
        .select(selectColumns)
        .eq("codigo_cuenta", codigoCuenta)
        .eq("esta_activo", true)
        .order("created_at", { ascending: false })
        .limit(limit);

      return query as unknown as Promise<{
        data: ProductoDbRow[] | null;
        error: { message: string } | null;
      }>;
    }),
  );

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

  const rows = await queryProductosCatalogo((selectColumns) =>
    runDomainQuery<
      {
        id_producto: string;
        descripcion: string;
        sku: string;
        metadatos_catalogo?: unknown;
      }[]
    >((client) => {
      const primarioColumns = selectColumns.includes("metadatos_catalogo")
        ? "id_producto,descripcion,sku,metadatos_catalogo"
        : "id_producto,descripcion,sku";

      const query = client
        .from("producto")
        .select(primarioColumns)
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
              metadatos_catalogo?: unknown;
            }[]
          | null;
        error: { message: string } | null;
      }>;
    }),
  );

  return rows.map((row) => {
    const meta = parseCatalogoMetadatos(row.metadatos_catalogo);
    const titulo = meta.titulo?.trim() || row.descripcion.trim();
    return {
      idProducto: row.id_producto,
      label: titulo ? `${titulo} (${row.sku})` : row.sku,
    };
  });
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

  const inserted = await insertProductoCatalogo(
    buildProductoInsertPayload(input, codigoCuenta, sku, titulo, codigo),
  );

  return mapProductoRow(inserted, 0);
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

/** Obtiene un producto del catálogo para edición. */
export async function getCatalogoProductoById(
  codigoCuenta: string,
  idProducto: string,
): Promise<ProductoDbRow | null> {
  const cuenta = requireCodigoCuenta(codigoCuenta);
  const id = idProducto.trim();

  if (!id) {
    throw new DomainServiceError("Producto no válido.", "INVALID_ARGUMENT");
  }

  const rows = await queryProductosCatalogo((selectColumns) =>
    runDomainQuery<ProductoDbRow[]>((client) => {
      const query = client
        .from("producto")
        .select(selectColumns)
        .eq("codigo_cuenta", cuenta)
        .eq("id_producto", id)
        .eq("esta_activo", true)
        .limit(1);

      return query as unknown as Promise<{
        data: ProductoDbRow[] | null;
        error: { message: string } | null;
      }>;
    }),
  );

  return rows[0] ?? null;
}

/** Actualiza metadatos y campos base de un producto del catálogo. */
export async function updateCatalogoProducto(
  input: UpdateCatalogoProductoInput,
): Promise<CatalogoProductoListRow> {
  const codigoCuenta = requireCodigoCuenta(input.codigoCuenta);
  const idProducto = input.idProducto.trim();
  const sku = input.sku.trim();
  const titulo = input.titulo.trim();

  if (!idProducto) {
    throw new DomainServiceError("Producto no válido.", "INVALID_ARGUMENT");
  }
  if (!sku) {
    throw new DomainServiceError("El SKU es obligatorio.", "INVALID_ARGUMENT");
  }
  if (!titulo) {
    throw new DomainServiceError("El título es obligatorio.", "INVALID_ARGUMENT");
  }

  const codigo = generateCodigoCuentaFromNombre(titulo) || sku;

  const updated = await runDomainMutation<ProductoDbRow>((client) => {
    const body: Record<string, unknown> = {
      sku,
      descripcion: titulo,
      codigo_almacen: codigo,
      unidad_medida: input.unidadMedida,
      unidad_visualizacion: input.unidadVisualizacion,
      es_primario: input.esPrimario,
      es_secundario: input.esSecundario,
      metadatos_catalogo: input.metadatos,
    };

    const query = client
      .from("producto")
      .update(body)
      .eq("codigo_cuenta", codigoCuenta)
      .eq("id_producto", idProducto)
      .select(`${PRODUCTO_LIST_COLUMNS},metadatos_catalogo`)
      .single();

    return query as unknown as Promise<{
      data: ProductoDbRow | null;
      error: { message: string } | null;
    }>;
  });

  return mapProductoRow(updated, 0);
}

/** Desactiva un producto del catálogo (baja lógica). */
export async function deactivateCatalogoProducto(
  codigoCuenta: string,
  idProducto: string,
): Promise<void> {
  const cuenta = requireCodigoCuenta(codigoCuenta);
  const id = idProducto.trim();

  if (!id) {
    throw new DomainServiceError("Producto no válido.", "INVALID_ARGUMENT");
  }

  await runDomainMutation((client) => {
    const query = client
      .from("producto")
      .update({ esta_activo: false })
      .eq("codigo_cuenta", cuenta)
      .eq("id_producto", id);

    return query as unknown as Promise<{
      data: unknown;
      error: { message: string } | null;
    }>;
  });
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

export interface CatalogoImportResult {
  imported: number;
  errors: string[];
  skipped: number;
}

async function createImportRow(
  codigoCuenta: string,
  row: CatalogoExcelImportRow,
  primariosBySku: Map<string, string>,
): Promise<void> {
  const unidadMedida = row.unidadVisualizacion === "peso" ? "g" : "und";

  if (row.tipo === "primario") {
    await createCatalogoProductoPrimario({
      codigoCuenta,
      sku: row.sku,
      titulo: row.titulo,
      unidadMedida,
      unidadVisualizacion: row.unidadVisualizacion,
      metadatos: row.metadatos,
    });
    return;
  }

  const idProductoPrimario = primariosBySku.get(row.skuPrimario ?? "");
  if (!idProductoPrimario) {
    throw new DomainServiceError(
      `No se encontró primario con SKU "${row.skuPrimario}" para "${row.sku}".`,
      "INVALID_ARGUMENT",
    );
  }

  await createCatalogoProductoSecundario({
    codigoCuenta,
    sku: row.sku,
    titulo: row.titulo,
    unidadMedida,
    unidadVisualizacion: row.unidadVisualizacion,
    idProductoPrimario,
    esPrimario: false,
    esSecundario: true,
    metadatos: row.metadatos,
  });
}

/** Importa productos desde Excel/CSV (primarios y luego secundarios). */
export async function importCatalogoProductosFromFile(
  codigoCuenta: string,
  file: File,
): Promise<CatalogoImportResult> {
  const cuenta = requireCodigoCuenta(codigoCuenta);
  const { rows, errors: parseErrors, skipped } =
    await parseCatalogoSpreadsheetFile(file);

  if (!rows.length) {
    return { imported: 0, errors: parseErrors, skipped };
  }

  const primarios = rows.filter((row) => row.tipo === "primario");
  const secundarios = rows.filter((row) => row.tipo === "secundario");
  const primariosBySku = new Map<string, string>();
  const errors = [...parseErrors];
  let imported = 0;

  for (const row of primarios) {
    try {
      const created = await createCatalogoProductoPrimario({
        codigoCuenta: cuenta,
        sku: row.sku,
        titulo: row.titulo,
        unidadMedida: row.unidadVisualizacion === "peso" ? "g" : "und",
        unidadVisualizacion: row.unidadVisualizacion,
        metadatos: row.metadatos,
      });
      primariosBySku.set(row.sku, created.idProducto);
      imported += 1;
    } catch (err: unknown) {
      errors.push(
        `SKU ${row.sku}: ${
          err instanceof DomainServiceError
            ? err.message
            : "No se pudo importar el producto."
        }`,
      );
    }
  }

  const existingPrimarios = await listProductosPrimariosCatalogo(cuenta);
  for (const option of existingPrimarios) {
    const skuMatch = /\(([^)]+)\)\s*$/.exec(option.label);
    const sku = skuMatch?.[1]?.trim();
    if (sku && !primariosBySku.has(sku)) {
      primariosBySku.set(sku, option.idProducto);
    }
  }

  for (const row of secundarios) {
    try {
      await createImportRow(cuenta, row, primariosBySku);
      imported += 1;
    } catch (err: unknown) {
      errors.push(
        `SKU ${row.sku}: ${
          err instanceof DomainServiceError
            ? err.message
            : "No se pudo importar el producto."
        }`,
      );
    }
  }

  return { imported, errors, skipped };
}
