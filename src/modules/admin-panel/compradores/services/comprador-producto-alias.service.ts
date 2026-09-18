import {
  requireCodigoCuenta,
  runDomainMutation,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import {
  listCatalogoProductosAdmin,
  listPreciosProductoVigentesAdmin,
  type CatalogoProductoListRow,
} from "@/modules/admin-panel/catalogo/services/productos-catalogo.service";
import { listCompradoresAdmin } from "./compradores.service";
import {
  buildCompradorPreciosTemplateRows,
  type CompradorPreciosExcelSourceRow,
} from "../utils/comprador-precios-excel";

const ALIAS_LIST_LIMIT = 500;
const ALIAS_CUENTA_LIST_LIMIT = 5000;
const CATALOGO_JOIN_LIMIT = 500;
const CATALOGO_TEMPLATE_LIMIT = 5000;

export interface CompradorProductoAliasRow {
  idAlias: string;
  idComprador: string;
  idProducto: string;
  alias: string;
  /** Precio especial del comprador; null = usar lista de precios. */
  precioOverride: number | null;
}

export interface CompradorProductoAliasListRow extends CompradorProductoAliasRow {
  codigoProducto: string;
  nombreProducto: string;
  /** Precio efectivo: override del comprador o lista default. */
  precio: number | null;
  /** Precio vigente en lista de precios (precio_producto). */
  precioLista: number | null;
  unidad: string;
}

interface CompradorProductoAliasDbRow {
  id_alias: string;
  id_comprador: string;
  id_producto: string;
  alias: string;
  precio: string | number | null;
  comprador?:
    | { codigo: string | null; nombre: string | null }
    | { codigo: string | null; nombre: string | null }[]
    | null;
}

const ALIAS_COLUMNS = "id_alias,id_comprador,id_producto,alias,precio";
const ALIAS_CUENTA_COLUMNS = `${ALIAS_COLUMNS},comprador(codigo,nombre)`;

function parsePrecioOverride(
  value: string | number | null | undefined,
): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapAliasRow(row: CompradorProductoAliasDbRow): CompradorProductoAliasRow {
  return {
    idAlias: row.id_alias,
    idComprador: row.id_comprador,
    idProducto: row.id_producto,
    alias: row.alias,
    precioOverride: parsePrecioOverride(row.precio),
  };
}

function nestedComprador(
  row: CompradorProductoAliasDbRow,
): { codigo: string; nombre: string } | null {
  const value = Array.isArray(row.comprador)
    ? row.comprador[0]
    : row.comprador;
  if (!value) return null;

  const codigo = value.codigo?.trim() ?? "";
  const nombre = value.nombre?.trim() ?? "";
  if (!codigo && !nombre) return null;

  return { codigo, nombre };
}

function isUniqueAliasViolation(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /duplicate key|unique constraint|uq_comprador_producto_alias/i.test(
    message,
  );
}

export interface ListCompradorProductoAliasParams {
  codigoCuenta: string;
  idComprador: string;
}

export interface CompradorProductoAliasCuentaRow
  extends CompradorProductoAliasListRow {
  codigoComprador: string;
  nombreComprador: string;
}

function toAliasListRow(
  row: CompradorProductoAliasDbRow,
  productoById: Map<string, CatalogoProductoListRow>,
  precioByProductoId: Record<string, number | null | undefined>,
): CompradorProductoAliasListRow {
  const mapped = mapAliasRow(row);
  const producto = productoById.get(row.id_producto);
  const precioListaRaw = precioByProductoId[row.id_producto];
  const precioLista =
    precioListaRaw !== undefined && precioListaRaw !== null
      ? precioListaRaw
      : null;

  return {
    ...mapped,
    codigoProducto: producto?.codigo ?? "—",
    nombreProducto: producto?.titulo ?? "—",
    unidad: producto?.unidad?.trim() || "—",
    precioLista,
    precio: mapped.precioOverride ?? precioLista,
  };
}

async function loadAliasProductoContext(
  codigoCuenta: string,
  aliasRows: CompradorProductoAliasDbRow[],
): Promise<{
  productoById: Map<string, CatalogoProductoListRow>;
  precioByProductoId: Record<string, number | null | undefined>;
}> {
  if (aliasRows.length === 0) {
    return {
      productoById: new Map(),
      precioByProductoId: {},
    };
  }

  const productoIds = [
    ...new Set(aliasRows.map((row) => row.id_producto).filter(Boolean)),
  ];

  const [productos, precioByProductoId] = await Promise.all([
    listCatalogoProductosAdmin({
      codigoCuenta,
      limit: Math.max(CATALOGO_JOIN_LIMIT, productoIds.length),
    }),
    listPreciosProductoVigentesAdmin({
      codigoCuenta,
      idProductos: productoIds,
    }),
  ]);

  return {
    productoById: new Map(
      productos.map((row) => [row.idProducto, row] as const),
    ),
    precioByProductoId,
  };
}

/**
 * Lista equivalencias del comprador.
 * El precio mostrado es el override del comprador o, si no hay, la lista default.
 */
export async function listCompradorProductoAliasAdmin(
  params: ListCompradorProductoAliasParams,
): Promise<CompradorProductoAliasListRow[]> {
  const codigoCuenta = requireCodigoCuenta(params.codigoCuenta);
  const idComprador = params.idComprador.trim();

  if (!idComprador) {
    throw new DomainServiceError(
      "Falta el identificador del comprador.",
      "INVALID_ARGUMENT",
    );
  }

  const aliasRows = await runDomainQuery<CompradorProductoAliasDbRow[]>(
    (client) => {
      const query = client
        .from("comprador_producto_alias")
        .select(ALIAS_COLUMNS)
        .eq("codigo_cuenta", codigoCuenta)
        .eq("id_comprador", idComprador)
        .order("alias", { ascending: true })
        .limit(ALIAS_LIST_LIMIT);

      return query as unknown as Promise<{
        data: CompradorProductoAliasDbRow[] | null;
        error: { message: string } | null;
      }>;
    },
  );

  const { productoById, precioByProductoId } = await loadAliasProductoContext(
    codigoCuenta,
    aliasRows,
  );

  return aliasRows.map((row) =>
    toAliasListRow(row, productoById, precioByProductoId),
  );
}

async function queryAliasCuentaRows(
  codigoCuenta: string,
): Promise<CompradorProductoAliasDbRow[]> {
  return runDomainQuery<CompradorProductoAliasDbRow[]>((client) => {
    const query = client
      .from("comprador_producto_alias")
      .select(ALIAS_CUENTA_COLUMNS)
      .eq("codigo_cuenta", codigoCuenta)
      .order("alias", { ascending: true })
      .limit(ALIAS_CUENTA_LIST_LIMIT);

    return query as unknown as Promise<{
      data: CompradorProductoAliasDbRow[] | null;
      error: { message: string } | null;
    }>;
  }).catch(async (error: unknown) => {
    if (!(error instanceof DomainServiceError)) throw error;

    return runDomainQuery<CompradorProductoAliasDbRow[]>((client) => {
      const query = client
        .from("comprador_producto_alias")
        .select(ALIAS_COLUMNS)
        .eq("codigo_cuenta", codigoCuenta)
        .order("alias", { ascending: true })
        .limit(ALIAS_CUENTA_LIST_LIMIT);

      return query as unknown as Promise<{
        data: CompradorProductoAliasDbRow[] | null;
        error: { message: string } | null;
      }>;
    });
  });
}

export interface ListCompradorProductoAliasCuentaParams {
  codigoCuenta: string;
}

/** Equivalencias de todos los compradores de la cuenta. */
export async function listCompradorProductoAliasCuentaAdmin(
  params: ListCompradorProductoAliasCuentaParams,
): Promise<CompradorProductoAliasCuentaRow[]> {
  const codigoCuenta = requireCodigoCuenta(params.codigoCuenta);
  const aliasRows = await queryAliasCuentaRows(codigoCuenta);

  if (aliasRows.length === 0) {
    return [];
  }

  const [{ productoById, precioByProductoId }, compradores] = await Promise.all([
    loadAliasProductoContext(codigoCuenta, aliasRows),
    listCompradoresAdmin({ codigoCuenta, soloActivos: false }),
  ]);

  const compradorById = new Map(
    compradores.map((row) => [row.idComprador, row] as const),
  );

  return aliasRows
    .map((row) => {
      const nested = nestedComprador(row);
      const listed = compradorById.get(row.id_comprador);

      return {
        ...toAliasListRow(row, productoById, precioByProductoId),
        codigoComprador: nested?.codigo || listed?.codigo || "",
        nombreComprador: nested?.nombre || listed?.comprador || "",
      };
    })
    .sort((left, right) => {
      const byComprador = left.nombreComprador.localeCompare(
        right.nombreComprador,
        "es",
      );
      if (byComprador !== 0) return byComprador;

      const byAlias = left.alias.localeCompare(right.alias, "es");
      if (byAlias !== 0) return byAlias;

      return left.codigoProducto.localeCompare(right.codigoProducto, "es");
    });
}

/** Matriz comprador × catálogo completo para la plantilla de precios. */
export async function listCompradorPreciosTemplateAdmin(params: {
  codigoCuenta: string;
}): Promise<CompradorPreciosExcelSourceRow[]> {
  const codigoCuenta = requireCodigoCuenta(params.codigoCuenta);

  const [compradores, productos, aliasRows] = await Promise.all([
    listCompradoresAdmin({
      codigoCuenta,
      soloActivos: false,
      limit: CATALOGO_TEMPLATE_LIMIT,
    }),
    listCatalogoProductosAdmin({
      codigoCuenta,
      soloActivos: false,
      limit: CATALOGO_TEMPLATE_LIMIT,
    }),
    queryAliasCuentaRows(codigoCuenta),
  ]);

  const precioListaByProductoId = await listPreciosProductoVigentesAdmin({
    codigoCuenta,
    idProductos: productos.map((row) => row.idProducto),
  });

  return buildCompradorPreciosTemplateRows({
    compradores: compradores.map((row) => ({
      idComprador: row.idComprador,
      codigo: row.codigo,
      nombre: row.comprador,
    })),
    productos: productos.map((row) => ({
      idProducto: row.idProducto,
      codigo: row.codigo,
      nombre: row.titulo,
    })),
    aliases: aliasRows.map((row) => ({
      idComprador: row.id_comprador,
      idProducto: row.id_producto,
      equivalencia: row.alias,
      precioOverride: parsePrecioOverride(row.precio),
    })),
    precioListaByProductoId,
  });
}

export interface CreateCompradorProductoAliasInput {
  codigoCuenta: string;
  idComprador: string;
  idProducto: string;
  alias: string;
  /** Si se omite o es null, el comprador usa la lista de precios. */
  precio?: number | null;
}

/** Guarda equivalencia (nombre/precio) solo para ese comprador. */
export async function createCompradorProductoAliasAdmin(
  input: CreateCompradorProductoAliasInput,
): Promise<CompradorProductoAliasRow> {
  const codigoCuenta = requireCodigoCuenta(input.codigoCuenta);
  const idComprador = input.idComprador.trim();
  const idProducto = input.idProducto.trim();
  const alias = input.alias.trim();
  const precio =
    input.precio === undefined || input.precio === null
      ? null
      : input.precio;

  if (!idComprador) {
    throw new DomainServiceError(
      "Selecciona un comprador.",
      "INVALID_ARGUMENT",
    );
  }

  if (!idProducto) {
    throw new DomainServiceError(
      "Selecciona un producto del catálogo.",
      "INVALID_ARGUMENT",
    );
  }

  if (!alias) {
    throw new DomainServiceError(
      "La equivalencia es obligatoria.",
      "INVALID_ARGUMENT",
    );
  }

  if (alias.length > 255) {
    throw new DomainServiceError(
      "La equivalencia no puede superar 255 caracteres.",
      "INVALID_ARGUMENT",
    );
  }

  if (precio != null && precio < 0) {
    throw new DomainServiceError(
      "Ingresa un precio válido (0 o mayor).",
      "INVALID_ARGUMENT",
    );
  }

  try {
    const inserted = await runDomainMutation<CompradorProductoAliasDbRow | null>(
      (client) => {
        const query = client
          .from("comprador_producto_alias")
          .insert({
            codigo_cuenta: codigoCuenta,
            id_comprador: idComprador,
            id_producto: idProducto,
            alias,
            precio,
          })
          .select(ALIAS_COLUMNS)
          .single();

        return query as unknown as Promise<{
          data: CompradorProductoAliasDbRow | null;
          error: { message: string } | null;
        }>;
      },
    );

    if (!inserted) {
      throw new DomainServiceError(
        "No se pudo guardar la equivalencia.",
        "MUTATION_FAILED",
      );
    }

    return mapAliasRow(inserted);
  } catch (error: unknown) {
    if (isUniqueAliasViolation(error)) {
      throw new DomainServiceError(
        "Este comprador ya tiene una equivalencia para ese producto.",
        "INVALID_ARGUMENT",
        error,
      );
    }

    throw error;
  }
}

export interface UpdateCompradorProductoAliasInput {
  codigoCuenta: string;
  idAlias: string;
  alias?: string;
  /** undefined = no tocar; null = volver a lista default. */
  precio?: number | null;
}

/** Actualiza equivalencia y/o precio override del comprador. */
export async function updateCompradorProductoAliasAdmin(
  input: UpdateCompradorProductoAliasInput,
): Promise<CompradorProductoAliasRow> {
  const codigoCuenta = requireCodigoCuenta(input.codigoCuenta);
  const idAlias = input.idAlias.trim();
  const hasAlias = input.alias !== undefined;
  const hasPrecio = input.precio !== undefined;

  if (!idAlias) {
    throw new DomainServiceError(
      "Falta el identificador de la equivalencia.",
      "INVALID_ARGUMENT",
    );
  }

  if (!hasAlias && !hasPrecio) {
    throw new DomainServiceError(
      "No hay cambios para guardar.",
      "INVALID_ARGUMENT",
    );
  }

  const payload: { alias?: string; precio?: number | null } = {};

  if (hasAlias) {
    const alias = (input.alias ?? "").trim();
    if (!alias) {
      throw new DomainServiceError(
        "La equivalencia es obligatoria.",
        "INVALID_ARGUMENT",
      );
    }
    if (alias.length > 255) {
      throw new DomainServiceError(
        "La equivalencia no puede superar 255 caracteres.",
        "INVALID_ARGUMENT",
      );
    }
    payload.alias = alias;
  }

  if (hasPrecio) {
    if (input.precio != null && input.precio < 0) {
      throw new DomainServiceError(
        "Ingresa un precio válido (0 o mayor).",
        "INVALID_ARGUMENT",
      );
    }
    payload.precio = input.precio ?? null;
  }

  const updated = await runDomainMutation<CompradorProductoAliasDbRow | null>(
    (client) => {
      const query = client
        .from("comprador_producto_alias")
        .update(payload)
        .eq("codigo_cuenta", codigoCuenta)
        .eq("id_alias", idAlias)
        .select(ALIAS_COLUMNS)
        .single();

      return query as unknown as Promise<{
        data: CompradorProductoAliasDbRow | null;
        error: { message: string } | null;
      }>;
    },
  );

  if (!updated) {
    throw new DomainServiceError(
      "No se pudo actualizar la equivalencia.",
      "MUTATION_FAILED",
    );
  }

  return mapAliasRow(updated);
}
