import {
  applyTenantFilters,
  DEFAULT_LIST_LIMIT,
  requireCodigoCuenta,
  type TenantListParams,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import type {
  OrdenVentaOperadorRow,
  OrdenVentaRow,
  ProductoVentaOption,
} from "../types/sales.types";

const ORDEN_VENTA_COLUMNS =
  "id_orden_venta,codigo_cuenta,id_bodega,id_cliente,id_comprador,id_planta,id_creador,id_bodega_destino,codigo,estado,fecha_pedido,observaciones,created_at,updated_at";

const COMPRADOR_COLUMNS = "id_comprador,nombre";

const ORDEN_VENTA_LINEA_COLUMNS = "id_orden_venta,id_producto";

const PRODUCTO_VENTA_COLUMNS = "id_producto,descripcion,sku";

interface CompradorDbRow {
  id_comprador: string;
  nombre: string;
}

interface OrdenVentaLineaDbRow {
  id_orden_venta: string;
  id_producto: string;
}

interface ProductoVentaDbRow {
  id_producto: string;
  descripcion: string;
  sku: string;
}

function resolveProductoLabel(row: ProductoVentaDbRow): string {
  const titulo = row.descripcion.trim();
  return titulo ? `${titulo} (${row.sku})` : row.sku;
}

function formatProductosResumen(count: number): string {
  if (count <= 0) return "—";
  return count === 1 ? "1 producto" : `${count} productos`;
}

async function fetchCompradorLabels(
  ids: string[],
): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();

  const uniqueIds = [...new Set(ids)];
  const rows = await runDomainQuery<CompradorDbRow[]>((client) => {
    const query = client
      .from("comprador")
      .select(COMPRADOR_COLUMNS)
      .in("id_comprador", uniqueIds)
      .limit(uniqueIds.length);

    return query as unknown as Promise<{
      data: CompradorDbRow[] | null;
      error: { message: string } | null;
    }>;
  });

  return new Map(rows.map((row) => [row.id_comprador, row.nombre.trim() || "—"]));
}

async function fetchLineasCountByOrden(
  ids: string[],
): Promise<Map<string, number>> {
  if (ids.length === 0) return new Map();

  const uniqueIds = [...new Set(ids)];
  const rows = await runDomainQuery<OrdenVentaLineaDbRow[]>((client) => {
    const query = client
      .from("orden_venta_linea")
      .select(ORDEN_VENTA_LINEA_COLUMNS)
      .in("id_orden_venta", uniqueIds)
      .limit(DEFAULT_LIST_LIMIT);

    return query as unknown as Promise<{
      data: OrdenVentaLineaDbRow[] | null;
      error: { message: string } | null;
    }>;
  });

  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.id_orden_venta, (counts.get(row.id_orden_venta) ?? 0) + 1);
  }

  return counts;
}

function mapOrdenVentaOperadorRow(
  row: OrdenVentaRow,
  compradorLabels: Map<string, string>,
  lineasCount: Map<string, number>,
): OrdenVentaOperadorRow {
  const productosCount = lineasCount.get(row.id_orden_venta) ?? 0;

  return {
    idOrdenVenta: row.id_orden_venta,
    venta: row.codigo,
    comprador: row.id_comprador
      ? (compradorLabels.get(row.id_comprador) ?? "—")
      : "—",
    productos: formatProductosResumen(productosCount),
    estado: row.estado,
    fecha: row.fecha_pedido || row.created_at,
  };
}

// TODO POL-5+: confirmar y despachar OV vía apiRequest al API Nest.

export async function listOrdenesVenta(
  params: TenantListParams,
): Promise<OrdenVentaRow[]> {
  const limit = params.limit ?? DEFAULT_LIST_LIMIT;

  return runDomainQuery((client) => {
    const query = applyTenantFilters(
      client.from("orden_venta").select(ORDEN_VENTA_COLUMNS),
      params,
    )
      .order("created_at", { ascending: false })
      .limit(limit);

    return query as unknown as Promise<{
      data: OrdenVentaRow[] | null;
      error: { message: string } | null;
    }>;
  });
}

export async function listOrdenesVentaOperador(
  params: TenantListParams,
): Promise<OrdenVentaOperadorRow[]> {
  const rows = await listOrdenesVenta({
    codigoCuenta: params.codigoCuenta,
    idBodega: params.idBodega,
    limit: params.limit,
  });

  const compradorIds = rows
    .map((row) => row.id_comprador)
    .filter((id): id is string => Boolean(id));
  const ordenIds = rows.map((row) => row.id_orden_venta);

  const [compradorLabels, lineasCount] = await Promise.all([
    fetchCompradorLabels(compradorIds),
    fetchLineasCountByOrden(ordenIds),
  ]);

  return rows.map((row) =>
    mapOrdenVentaOperadorRow(row, compradorLabels, lineasCount),
  );
}

export async function listProductosVentaCatalogo(
  codigoCuenta: string,
): Promise<ProductoVentaOption[]> {
  const cuenta = requireCodigoCuenta(codigoCuenta);

  const rows = await runDomainQuery<ProductoVentaDbRow[]>((client) => {
    const query = client
      .from("producto")
      .select(PRODUCTO_VENTA_COLUMNS)
      .eq("codigo_cuenta", cuenta)
      .eq("esta_activo", true)
      .order("descripcion", { ascending: true })
      .limit(DEFAULT_LIST_LIMIT);

    return query as unknown as Promise<{
      data: ProductoVentaDbRow[] | null;
      error: { message: string } | null;
    }>;
  });

  return rows.map((row) => ({
    idProducto: row.id_producto,
    label: resolveProductoLabel(row),
  }));
}
