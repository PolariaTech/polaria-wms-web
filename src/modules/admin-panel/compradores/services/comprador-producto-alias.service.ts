import {
  requireCodigoCuenta,
  runDomainMutation,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/utils/domain-service-error";

const ALIAS_LIST_LIMIT = 500;

export interface CompradorProductoAliasRow {
  idAlias: string;
  idComprador: string;
  idProducto: string;
  alias: string;
}

export interface CompradorProductoAliasListRow extends CompradorProductoAliasRow {
  codigoProducto: string;
  nombreProducto: string;
}

interface CompradorProductoAliasDbRow {
  id_alias: string;
  id_comprador: string;
  id_producto: string;
  alias: string;
}

const ALIAS_COLUMNS = "id_alias,id_comprador,id_producto,alias";

interface ProductoAliasJoinDbRow {
  id_producto: string;
  sku: string;
  descripcion: string;
  codigo_almacen: string | null;
}

function mapAliasRow(row: CompradorProductoAliasDbRow): CompradorProductoAliasRow {
  return {
    idAlias: row.id_alias,
    idComprador: row.id_comprador,
    idProducto: row.id_producto,
    alias: row.alias,
  };
}

function isUniqueAliasViolation(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /duplicate key|unique constraint|uq_comprador_producto_alias/i.test(
    message,
  );
}

function mapProductoAliasLabel(row: ProductoAliasJoinDbRow | undefined): {
  codigoProducto: string;
  nombreProducto: string;
} {
  if (!row) {
    return { codigoProducto: "—", nombreProducto: "—" };
  }

  return {
    codigoProducto: row.codigo_almacen?.trim() || row.sku || "—",
    nombreProducto: row.descripcion.trim() || "—",
  };
}

export interface ListCompradorProductoAliasParams {
  codigoCuenta: string;
  idComprador: string;
}

/** Lista los alias de producto de un comprador, con código y nombre del catálogo. */
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

  if (aliasRows.length === 0) {
    return [];
  }

  const productoIds = [
    ...new Set(aliasRows.map((row) => row.id_producto).filter(Boolean)),
  ];

  const productos =
    productoIds.length === 0
      ? []
      : await runDomainQuery<ProductoAliasJoinDbRow[]>((client) => {
          const query = client
            .from("producto")
            .select("id_producto,sku,descripcion,codigo_almacen")
            .eq("codigo_cuenta", codigoCuenta)
            .in("id_producto", productoIds)
            .limit(ALIAS_LIST_LIMIT);

          return query as unknown as Promise<{
            data: ProductoAliasJoinDbRow[] | null;
            error: { message: string } | null;
          }>;
        });

  const productoById = new Map(
    productos.map((row) => [row.id_producto, row] as const),
  );

  return aliasRows.map((row) => ({
    ...mapAliasRow(row),
    ...mapProductoAliasLabel(productoById.get(row.id_producto)),
  }));
}

export interface CreateCompradorProductoAliasInput {
  codigoCuenta: string;
  idComprador: string;
  idProducto: string;
  alias: string;
}

/** Guarda el nombre con el que un comprador conoce un producto del catálogo. */
export async function createCompradorProductoAliasAdmin(
  input: CreateCompradorProductoAliasInput,
): Promise<CompradorProductoAliasRow> {
  const codigoCuenta = requireCodigoCuenta(input.codigoCuenta);
  const idComprador = input.idComprador.trim();
  const idProducto = input.idProducto.trim();
  const alias = input.alias.trim();

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
      "El alias es obligatorio.",
      "INVALID_ARGUMENT",
    );
  }

  if (alias.length > 255) {
    throw new DomainServiceError(
      "El alias no puede superar 255 caracteres.",
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
        "No se pudo guardar el alias.",
        "MUTATION_FAILED",
      );
    }

    return mapAliasRow(inserted);
  } catch (error: unknown) {
    if (isUniqueAliasViolation(error)) {
      throw new DomainServiceError(
        "Este comprador ya tiene un alias para ese producto.",
        "INVALID_ARGUMENT",
        error,
      );
    }

    throw error;
  }
}
