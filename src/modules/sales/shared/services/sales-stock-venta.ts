import {
  DEFAULT_LIST_LIMIT,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import { listAlmacenamientoVentaUbicacionIds } from "@/modules/warehouses/estado-bodega/utils/estado-bodega-zone-ubicaciones";
import type { UbicacionEstadoBodegaDbRow } from "@/modules/warehouses/estado-bodega/types/estado-bodega.types";
import { resolveNombreProductoVenta } from "../utils/producto-venta-nombre";
import {
  UNIDAD_MEDIDA_VENTA_DEFAULT,
  type ProductoVentaOption,
} from "../types/sales.types";
import {
  parseCantidadKg,
  UBICACION_VENTA_SELECT,
  WAREHOUSE_STOCK_VENTA_SELECT,
  type StockVentaProductoAgg,
  type WarehouseStockVentaRow,
} from "./sales-orden-venta.db";

function unwrapProductoRel(
  value: WarehouseStockVentaRow["producto"],
): {
  id_producto: string;
  sku: string | null;
  descripcion: string | null;
  id_cliente: string | null;
  metadatos_catalogo?: unknown;
} | null {
  if (!value) return null;
  const row = Array.isArray(value) ? value[0] : value;
  if (!row) return null;
  return {
    id_producto: row.id_producto,
    sku: row.sku,
    descripcion: row.descripcion,
    id_cliente: row.id_cliente ?? null,
    metadatos_catalogo: row.metadatos_catalogo,
  };
}

export async function resolveBodegaIdsForCuenta(
  codigoCuenta: string,
): Promise<string[]> {
  const rows = await runDomainQuery<{ id_bodega: string }[]>((client) => {
    const query = client
      .from("bodega")
      .select("id_bodega")
      .eq("codigo_cuenta", codigoCuenta)
      .eq("esta_activa", true)
      .order("nombre", { ascending: true })
      .limit(DEFAULT_LIST_LIMIT);

    return query as unknown as Promise<{
      data: { id_bodega: string }[] | null;
      error: { message: string } | null;
    }>;
  });

  return rows.map((row) => row.id_bodega).filter(Boolean);
}

async function fetchUbicacionesVenta(
  bodegaIds: string[],
): Promise<UbicacionEstadoBodegaDbRow[]> {
  if (bodegaIds.length === 0) return [];

  return runDomainQuery<UbicacionEstadoBodegaDbRow[]>((client) => {
    const query = client
      .from("ubicacion")
      .select(UBICACION_VENTA_SELECT)
      .in("id_bodega", bodegaIds)
      .eq("esta_activa", true)
      .limit(500);

    return query as unknown as Promise<{
      data: UbicacionEstadoBodegaDbRow[] | null;
      error: { message: string } | null;
    }>;
  });
}

async function fetchWarehouseStockForVenta(
  codigoCuenta: string,
  bodegaIds: string[],
): Promise<WarehouseStockVentaRow[]> {
  if (bodegaIds.length > 0) {
    const byBodega = await runDomainQuery<WarehouseStockVentaRow[]>((client) => {
      const query = client
        .from("warehouse_state")
        .select(WAREHOUSE_STOCK_VENTA_SELECT)
        .in("id_bodega", bodegaIds)
        .limit(500);

      return query as unknown as Promise<{
        data: WarehouseStockVentaRow[] | null;
        error: { message: string } | null;
      }>;
    });

    if (byBodega.length > 0) {
      return byBodega;
    }
  }

  return runDomainQuery<WarehouseStockVentaRow[]>((client) => {
    const query = client
      .from("warehouse_state")
      .select(WAREHOUSE_STOCK_VENTA_SELECT)
      .eq("codigo_cuenta", codigoCuenta)
      .limit(500);

    return query as unknown as Promise<{
      data: WarehouseStockVentaRow[] | null;
      error: { message: string } | null;
    }>;
  });
}

export async function collectStockVentaPorProducto(
  codigoCuenta: string,
): Promise<Map<string, StockVentaProductoAgg>> {
  const bodegaIds = await resolveBodegaIdsForCuenta(codigoCuenta);
  const [stockRows, ubicaciones] = await Promise.all([
    fetchWarehouseStockForVenta(codigoCuenta, bodegaIds),
    fetchUbicacionesVenta(bodegaIds),
  ]);
  const almacenamientoUbicacionIds = listAlmacenamientoVentaUbicacionIds(
    ubicaciones,
  );
  const filtrarPorZona = ubicaciones.length > 0;
  const kgByProducto = new Map<string, StockVentaProductoAgg>();

  for (const row of stockRows) {
    if (
      filtrarPorZona &&
      !almacenamientoUbicacionIds.has(row.id_ubicacion)
    ) {
      continue;
    }

    const disponible =
      parseCantidadKg(row.cantidad) - parseCantidadKg(row.cantidad_reservada);
    if (disponible <= 0) continue;

    const current = kgByProducto.get(row.id_producto);
    kgByProducto.set(row.id_producto, {
      kgDisponible: (current?.kgDisponible ?? 0) + disponible,
      sampleRow: current?.sampleRow ?? row,
    });
  }

  return kgByProducto;
}

export function mapStockRowToProductoOption(
  idProducto: string,
  stock: StockVentaProductoAgg,
  precioUnitario: number,
  unidadMedida: string,
): ProductoVentaOption {
  const productoRel = unwrapProductoRel(stock.sampleRow.producto);
  const codigo = productoRel?.sku?.trim() || idProducto.slice(0, 8);
  const nombre = resolveNombreProductoVenta(
    productoRel,
    codigo,
  );

  return {
    idProducto,
    label: `${nombre} (${codigo})`,
    idCliente: productoRel?.id_cliente ?? null,
    idBodega: stock.sampleRow.id_bodega,
    codigo,
    nombre,
    kgDisponible: stock.kgDisponible,
    precioUnitario,
    unidadMedida: unidadMedida.trim() || UNIDAD_MEDIDA_VENTA_DEFAULT,
  };
}
