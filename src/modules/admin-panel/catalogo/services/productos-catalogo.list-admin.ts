import {
  DEFAULT_LIST_LIMIT,
  requireCodigoCuenta,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import { isCatalogoTipoProductoMercancia } from "../constants/catalogo-producto";
import { mapProductoRow, queryProductosCatalogo } from "./productos-catalogo.db-helpers";
import type {
  CatalogoProductoListRow,
  ListCatalogoProductosParams,
  ProductoDbRow,
} from "./productos-catalogo.types";

/** Lista productos del catálogo de la cuenta tenant. */
export async function listCatalogoProductosAdmin(
  params: ListCatalogoProductosParams,
): Promise<CatalogoProductoListRow[]> {
  const codigoCuenta = requireCodigoCuenta(params.codigoCuenta);
  const limit = params.limit ?? DEFAULT_LIST_LIMIT;
  const search = params.search?.trim().toLowerCase() ?? "";
  const soloActivos = params.soloActivos !== false;
  const soloMercancia = params.soloMercancia !== false;

  const rows = await queryProductosCatalogo((selectColumns) =>
    runDomainQuery<ProductoDbRow[]>((client) => {
      let query = client
        .from("producto")
        .select(selectColumns)
        .eq("codigo_cuenta", codigoCuenta);

      if (soloActivos) {
        query = query.eq("esta_activo", true);
      }

      const finalQuery = query
        .order("created_at", { ascending: false })
        .limit(limit);

      return finalQuery as unknown as Promise<{
        data: ProductoDbRow[] | null;
        error: { message: string } | null;
      }>;
    }),
  );

  let mapped = rows.map((row, index) => mapProductoRow(row, index));

  if (soloMercancia) {
    mapped = mapped.filter((row) =>
      isCatalogoTipoProductoMercancia(row.tipoProductoCodigo),
    );
  }

  if (!search) return mapped;

  return mapped.filter((row) => {
    const haystack = [
      row.titulo,
      row.codigo,
      row.sku,
      row.proveedor,
      row.categoria,
      row.slug,
      row.tipoProducto,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(search);
  });
}