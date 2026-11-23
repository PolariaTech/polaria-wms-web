import {
  requireCodigoCuenta,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import {
  isCatalogoTipoProductoMercancia,
  parseCatalogoMetadatos,
} from "@/modules/admin-panel/catalogo/constants/catalogo-producto";
import { resolveNombreProductoVenta } from "../utils/producto-venta-nombre";
import {
  UNIDAD_MEDIDA_VENTA_DEFAULT,
  type ProductoVentaOption,
} from "../types/sales.types";
import { fetchPreciosProductoMap } from "./sales-precios-venta";
import {
  collectStockVentaPorProducto,
  mapStockRowToProductoOption,
  resolveBodegaIdsForCuenta,
} from "./sales-stock-venta";

export interface ListProductosVentaCatalogoParams {
  codigoCuenta: string;
  idBodega?: string | null;
}

/** Bodega por defecto configurada en la cuenta (`cuenta.id_bodega_default`). */
export async function getCuentaIdBodegaDefault(
  codigoCuenta: string,
): Promise<string | null> {
  const cuenta = requireCodigoCuenta(codigoCuenta);
  const rows = await runDomainQuery<{ id_bodega_default: string | null }[]>(
    (client) => {
      const query = client
        .from("cuenta")
        .select("id_bodega_default")
        .eq("codigo_cuenta", cuenta)
        .limit(1);

      return query as unknown as Promise<{
        data: { id_bodega_default: string | null }[] | null;
        error: { message: string } | null;
      }>;
    },
  );

  return rows[0]?.id_bodega_default?.trim() || null;
}

export async function listProductosVentaCatalogo(
  params: ListProductosVentaCatalogoParams | string,
): Promise<ProductoVentaOption[]> {
  const { codigoCuenta } =
    typeof params === "string"
      ? { codigoCuenta: params }
      : params;
  const cuenta = requireCodigoCuenta(codigoCuenta);

  const [bodegaIds, productoRows, stockMap] = await Promise.all([
    resolveBodegaIdsForCuenta(cuenta),
    runDomainQuery<
      {
        id_producto: string;
        sku: string | null;
        descripcion: string | null;
        id_cliente: string | null;
        unidad_medida: string | null;
        metadatos_catalogo?: unknown;
      }[]
    >((client) => {
      const query = client
        .from("producto")
        .select(
          "id_producto,sku,descripcion,id_cliente,unidad_medida,metadatos_catalogo,esta_activo",
        )
        .eq("codigo_cuenta", cuenta)
        .eq("esta_activo", true)
        .order("descripcion", { ascending: true })
        .limit(1000);

      return query as unknown as Promise<{
        data:
          | {
              id_producto: string;
              sku: string | null;
              descripcion: string | null;
              id_cliente: string | null;
              unidad_medida: string | null;
              metadatos_catalogo?: unknown;
            }[]
          | null;
        error: { message: string } | null;
      }>;
    }),
    collectStockVentaPorProducto(cuenta),
  ]);

  const defaultBodegaId = bodegaIds[0] ?? "";
  if (!defaultBodegaId && stockMap.size === 0) {
    return [];
  }

  /** Solo mercancía vendible (`tipo_producto = 1`); excluye servicios. */
  const productosMercancia = productoRows.filter((row) => {
    const meta = parseCatalogoMetadatos(row.metadatos_catalogo);
    return isCatalogoTipoProductoMercancia(meta.tipo_producto);
  });

  const precioMap = await fetchPreciosProductoMap(
    cuenta,
    productosMercancia.map((row) => row.id_producto),
  );

  return productosMercancia
    .map((row) => {
      const unidadMedida =
        row.unidad_medida?.trim() || UNIDAD_MEDIDA_VENTA_DEFAULT;
      const stock = stockMap.get(row.id_producto);
      if (stock) {
        return mapStockRowToProductoOption(
          row.id_producto,
          stock,
          precioMap.get(row.id_producto) ?? 0,
          unidadMedida,
        );
      }

      const codigo = row.sku?.trim() || row.id_producto.slice(0, 8);
      const nombre = resolveNombreProductoVenta(row, codigo);

      return {
        idProducto: row.id_producto,
        label: `${nombre} (${codigo})`,
        idCliente: row.id_cliente ?? null,
        idBodega: defaultBodegaId,
        codigo,
        nombre,
        kgDisponible: 0,
        precioUnitario: precioMap.get(row.id_producto) ?? 0,
        unidadMedida,
      } satisfies ProductoVentaOption;
    })
    .filter((row) => Boolean(row.idBodega))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}
