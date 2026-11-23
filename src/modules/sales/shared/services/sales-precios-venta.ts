import {
  requireCodigoCuenta,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import {
  mapLatestPrecioProductoById,
  type PrecioProductoRow,
} from "../utils/sales-precio";

/**
 * REQ-135: último precio unitario vendido a este cliente por producto
 * (órdenes no canceladas, más reciente primero).
 */
export async function fetchUltimosPreciosPorComprador(input: {
  codigoCuenta: string;
  idComprador: string;
}): Promise<Record<string, number>> {
  const cuenta = requireCodigoCuenta(input.codigoCuenta);
  const idComprador = input.idComprador.trim();
  if (!idComprador) return {};

  const ovRows = await runDomainQuery<{ id_orden_venta: string }[]>(
    (client) => {
      const query = client
        .from("orden_venta")
        .select("id_orden_venta")
        .eq("codigo_cuenta", cuenta)
        .eq("id_comprador", idComprador)
        .neq("estado", "cancelada")
        .order("created_at", { ascending: false })
        .limit(80);

      return query as unknown as Promise<{
        data: { id_orden_venta: string }[] | null;
        error: { message: string } | null;
      }>;
    },
  );

  const ovIds = ovRows
    .map((row) => row.id_orden_venta?.trim())
    .filter(Boolean);
  if (ovIds.length === 0) return {};

  type LineaRow = {
    id_producto: string;
    precio_unitario: number | string | null;
    id_orden_venta: string;
  };

  const lineas = await runDomainQuery<LineaRow[]>((client) => {
    const query = client
      .from("orden_venta_linea")
      .select("id_producto,precio_unitario,id_orden_venta")
      .in("id_orden_venta", ovIds)
      .gt("precio_unitario", 0)
      .limit(1200);

    return query as unknown as Promise<{
      data: LineaRow[] | null;
      error: { message: string } | null;
    }>;
  });

  // Recorrer OVs de más reciente a más antigua para quedarnos con el último precio.
  const ovRank = new Map(ovIds.map((id, index) => [id, index]));
  const ranked = [...lineas].sort((a, b) => {
    const ra = ovRank.get(a.id_orden_venta) ?? 9999;
    const rb = ovRank.get(b.id_orden_venta) ?? 9999;
    return ra - rb;
  });

  const out: Record<string, number> = {};
  for (const row of ranked) {
    const id = row.id_producto?.trim();
    if (!id || out[id] != null) continue;
    const precio = Number(row.precio_unitario);
    if (!Number.isFinite(precio) || precio <= 0) continue;
    out[id] = precio;
  }
  return out;
}

export async function fetchPreciosProductoMap(
  codigoCuenta: string,
  idProductos: string[],
): Promise<Map<string, number>> {
  const uniqueIds = [...new Set(idProductos.map((id) => id.trim()).filter(Boolean))];
  if (uniqueIds.length === 0) return new Map();

  const rows = await runDomainQuery<PrecioProductoRow[]>((client) => {
    const query = client
      .from("precio_producto")
      .select("id_producto,precio,fecha_aplicacion")
      .eq("codigo_cuenta", codigoCuenta)
      .in("id_producto", uniqueIds)
      .order("fecha_aplicacion", { ascending: false })
      .limit(Math.min(Math.max(uniqueIds.length * 20, uniqueIds.length), 1000));

    return query as unknown as Promise<{
      data: PrecioProductoRow[] | null;
      error: { message: string } | null;
    }>;
  });

  return mapLatestPrecioProductoById(rows);
}

export async function fetchPreciosUnitariosProductos(
  codigoCuenta: string,
  idProductos: string[],
): Promise<Map<string, number>> {
  const uniqueIds = [...new Set(idProductos.map((id) => id.trim()).filter(Boolean))];
  if (uniqueIds.length === 0) return new Map();

  const [productRows, precioMap] = await Promise.all([
    runDomainQuery<{ id_producto: string }[]>((client) => {
      const query = client
        .from("producto")
        .select("id_producto")
        .eq("codigo_cuenta", codigoCuenta)
        .in("id_producto", uniqueIds)
        .limit(uniqueIds.length);

      return query as unknown as Promise<{
        data: { id_producto: string }[] | null;
        error: { message: string } | null;
      }>;
    }),
    fetchPreciosProductoMap(codigoCuenta, uniqueIds),
  ]);

  return new Map(
    productRows.map((row) => [
      row.id_producto,
      precioMap.get(row.id_producto) ?? 0,
    ]),
  );
}
