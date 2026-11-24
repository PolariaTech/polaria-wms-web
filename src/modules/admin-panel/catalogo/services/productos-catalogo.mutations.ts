import {
  requireCodigoCuenta,
  runDomainMutation,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { generateCodigoCuentaFromNombre } from "@/lib/utils/generate-codigo-cuenta";
import {
  buildProductoInsertPayload,
  insertProductoCatalogo,
  mapProductoRow,
  PRODUCTO_LIST_COLUMNS,
  queryProductosCatalogo,
} from "./productos-catalogo.db-helpers";
import type {
  CatalogoProductoListRow,
  CreateCatalogoProductoInput,
  ProductoDbRow,
  UpdateCatalogoProductoInput,
} from "./productos-catalogo.types";

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

/** Reactiva un producto del catálogo. */
export async function activateCatalogoProducto(
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
      .update({ esta_activo: true })
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