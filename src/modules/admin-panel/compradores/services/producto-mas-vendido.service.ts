import {
  requireCodigoCuenta,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import {
  listCatalogoProductosAdmin,
  type CatalogoProductoListRow,
} from "@/modules/admin-panel/catalogo/services/productos-catalogo.service";

export interface ProductoMasVendidoListRow {
  idProducto: string;
  codigo: string;
  nombre: string;
  /** Ranking de ventas (1 = más vendido). Null si no está en la tmp. */
  ranking: number | null;
  unidadesVendidas: number;
}

interface TmpProductoMasVendidoDbRow {
  id_producto: string;
  ranking: number | null;
  unidades_vendidas: number | string | null;
}

function parseUnidades(value: number | string | null | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

/**
 * Lista TODO el catálogo de productos para filtros de exportación.
 * Los de `tmp_producto_mas_vendido` van primero (más vendido → menos vendido);
 * el resto después, por nombre.
 */
export async function listProductosMasVendidosAdmin(params: {
  codigoCuenta: string;
  limit?: number;
}): Promise<ProductoMasVendidoListRow[]> {
  const codigoCuenta = requireCodigoCuenta(params.codigoCuenta);
  const limit = Math.min(Math.max(params.limit ?? 5000, 1), 5000);

  const catalogo = await listCatalogoProductosAdmin({
    codigoCuenta,
    soloActivos: false,
    limit,
  });

  let tmpRows: TmpProductoMasVendidoDbRow[] = [];
  try {
    tmpRows = await runDomainQuery<TmpProductoMasVendidoDbRow[]>((client) => {
      const query = client
        .from("tmp_producto_mas_vendido")
        .select("id_producto,ranking,unidades_vendidas")
        .eq("codigo_cuenta", codigoCuenta)
        .order("ranking", { ascending: true })
        .limit(limit);

      return query as unknown as Promise<{
        data: TmpProductoMasVendidoDbRow[] | null;
        error: { message: string } | null;
      }>;
    });
  } catch (error: unknown) {
    const message =
      error instanceof DomainServiceError
        ? error.message
        : error instanceof Error
          ? error.message
          : "";
    if (!/tmp_producto_mas_vendido|does not exist|42P01/i.test(message)) {
      throw error;
    }
  }

  const rankingById = new Map(
    tmpRows.map((row) => [
      row.id_producto,
      {
        ranking: row.ranking ?? Number.MAX_SAFE_INTEGER,
        unidadesVendidas: parseUnidades(row.unidades_vendidas),
      },
    ]),
  );

  return catalogo
    .map((producto: CatalogoProductoListRow) => {
      const stats = rankingById.get(producto.idProducto);
      return {
        idProducto: producto.idProducto,
        codigo: producto.codigo,
        nombre: producto.titulo,
        ranking: stats ? stats.ranking : null,
        unidadesVendidas: stats?.unidadesVendidas ?? 0,
      } satisfies ProductoMasVendidoListRow;
    })
    .sort((left, right) => {
      const leftRank = left.ranking ?? Number.MAX_SAFE_INTEGER;
      const rightRank = right.ranking ?? Number.MAX_SAFE_INTEGER;
      if (leftRank !== rightRank) return leftRank - rightRank;
      if (left.unidadesVendidas !== right.unidadesVendidas) {
        return right.unidadesVendidas - left.unidadesVendidas;
      }
      return left.nombre.localeCompare(right.nombre, "es");
    });
}
