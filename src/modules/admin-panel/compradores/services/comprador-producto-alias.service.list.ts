import {
  requireCodigoCuenta,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import {
  listCatalogoProductosAdmin,
  listPreciosProductoVigentesAdmin,
} from "@/modules/admin-panel/catalogo/services/productos-catalogo.service";
import { listCompradoresAdmin } from "./compradores.service";
import {
  buildCompradorPreciosTemplateRows,
  type CompradorPreciosExcelSourceRow,
  type CompradorPreciosExportFilters,
} from "../utils/comprador-precios-excel";
import {
  ALIAS_COLUMNS,
  ALIAS_CUENTA_COLUMNS,
  ALIAS_CUENTA_LIST_LIMIT,
  ALIAS_LIST_LIMIT,
  CATALOGO_TEMPLATE_LIMIT,
  loadAliasProductoContext,
  nestedComprador,
  parsePrecioOverride,
  toAliasListRow,
  type CompradorProductoAliasCuentaRow,
  type CompradorProductoAliasDbRow,
  type CompradorProductoAliasListRow,
  type ListCompradorProductoAliasParams,
} from "./comprador-producto-alias.service.types";

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

export async function queryAliasCuentaRows(
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
  filters?: CompradorPreciosExportFilters;
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
      grupo: row.grupo,
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
    filters: params.filters,
  });
}
