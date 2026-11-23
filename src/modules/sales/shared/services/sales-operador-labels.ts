import {
  DEFAULT_LIST_LIMIT,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import {
  normalizeOvSlaConfig,
  type OvSlaConfig,
} from "../utils/ov-sla";
import {
  COMPRADOR_COLUMNS,
  ORDEN_VENTA_LINEA_COLUMNS,
  ORDEN_VENTA_LINEA_IN_CHUNK,
  parseCantidadKg,
  type BodegaDestinoDbRow,
  type CompradorDbRow,
  type OrdenVentaLineaDbRow,
  type OrdenVentaLineasResumen,
} from "./sales-orden-venta.db";

export function formatProductosResumen(count: number): string {
  if (count <= 0) return "—";
  return count === 1 ? "1 producto" : `${count} productos`;
}

export async function fetchCompradorLabels(
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

export async function fetchBodegaDestinoLabels(
  ids: string[],
): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();

  const uniqueIds = [...new Set(ids)];
  const rows = await runDomainQuery<BodegaDestinoDbRow[]>((client) => {
    const query = client
      .from("bodega")
      .select("id_bodega,nombre")
      .in("id_bodega", uniqueIds)
      .limit(uniqueIds.length);

    return query as unknown as Promise<{
      data: BodegaDestinoDbRow[] | null;
      error: { message: string } | null;
    }>;
  });

  return new Map(
    rows.map((row) => [row.id_bodega, row.nombre.trim() || row.id_bodega]),
  );
}

export function chunkIds(ids: string[], size: number): string[][] {
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += size) {
    chunks.push(ids.slice(i, i + size));
  }
  return chunks;
}

export async function fetchLineasResumenByOrden(
  ids: string[],
): Promise<Map<string, OrdenVentaLineasResumen>> {
  if (ids.length === 0) return new Map();

  const uniqueIds = [...new Set(ids)];
  const chunks = chunkIds(uniqueIds, ORDEN_VENTA_LINEA_IN_CHUNK);
  const chunkRows = await Promise.all(
    chunks.map((chunk) =>
      runDomainQuery<OrdenVentaLineaDbRow[]>((client) => {
        const query = client
          .from("orden_venta_linea")
          .select(ORDEN_VENTA_LINEA_COLUMNS)
          .in("id_orden_venta", chunk)
          .limit(DEFAULT_LIST_LIMIT);

        return query as unknown as Promise<{
          data: OrdenVentaLineaDbRow[] | null;
          error: { message: string } | null;
        }>;
      }),
    ),
  );
  const rows = chunkRows.flat();

  const resumen = new Map<string, OrdenVentaLineasResumen>();
  for (const row of rows) {
    const cantidadKg = parseCantidadKg(row.cantidad_pedida);
    const precioUnitario = parseCantidadKg(row.precio_unitario);
    const current = resumen.get(row.id_orden_venta) ?? {
      count: 0,
      cantidadKg: 0,
      total: 0,
    };

    resumen.set(row.id_orden_venta, {
      count: current.count + 1,
      cantidadKg: current.cantidadKg + cantidadKg,
      total: current.total + cantidadKg * precioUnitario,
    });
  }

  return resumen;
}

export async function fetchCuentaOvSlaByCodigo(
  codigos: string[],
): Promise<Map<string, OvSlaConfig>> {
  const unique = [...new Set(codigos.map((c) => c.trim()).filter(Boolean))];
  if (unique.length === 0) return new Map();

  try {
    const rows = await runDomainQuery<
      {
        codigo_cuenta: string;
        ov_sla_minutos: number | null;
        ov_alerta_minutos: number | null;
      }[]
    >((client) => {
      const query = client
        .from("cuenta")
        .select("codigo_cuenta,ov_sla_minutos,ov_alerta_minutos")
        .in("codigo_cuenta", unique)
        .limit(unique.length);

      return query as unknown as Promise<{
        data:
          | {
              codigo_cuenta: string;
              ov_sla_minutos: number | null;
              ov_alerta_minutos: number | null;
            }[]
          | null;
        error: { message: string } | null;
      }>;
    });

    return new Map(
      rows.map((row) => [
        row.codigo_cuenta,
        normalizeOvSlaConfig(row.ov_sla_minutos, row.ov_alerta_minutos),
      ]),
    );
  } catch {
    return new Map();
  }
}
