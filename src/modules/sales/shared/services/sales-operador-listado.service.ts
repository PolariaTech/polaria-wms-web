/**
 * Canal A (Supabase+RLS): listado operador OV y enriquecimientos de lectura.
 * Emitir/cancelar → sales-api.service (canal B). Ver wms-channels / ARQUITECTURA-COMUNICACION.
 */
import { applyTenantFilters, applyRecentOrdersFilter, DEFAULT_LIST_LIMIT, requireCodigoCuenta, requireIdBodega, type TenantListParams, runDomainQuery } from "@/lib/supabase/domain-query";
import { normalizeEstadoOrdenVenta } from "../constants/sales-status";
import { collectOrdenesCompraCliente, countOrdenesTrabajo } from "../../ordenes/utils/display/orden-venta-tabla-meta";
import type { OrdenVentaOperadorRow, OrdenVentaRow } from "../types/sales.types";
import { computeOvSla, normalizeOvSlaConfig, type OvSlaConfig } from "../utils/ov-sla";
import { enrichOperadorListadoAnnotations } from "./enrich-operador-listado-annotations";
import { camposInicialesFilaOperador } from "./campos-iniciales-fila-operador";
import { ORDEN_VENTA_COLUMNS, ORDEN_VENTA_OPERADOR_LIST_COLUMNS, sortOrdenesVentaPorCreacionDesc, type OrdenVentaLineasResumen, type OrdenVentaOperadorListRow } from "./sales-orden-venta.db";
import { fetchBodegaDestinoLabels, fetchCompradorLabels, fetchCuentaOvSlaByCodigo, fetchLineasResumenByOrden, formatProductosResumen } from "./sales-operador-labels";

export function mapOrdenVentaOperadorRow(
  row: OrdenVentaOperadorListRow,
  compradorLabels: Map<string, string>,
  lineasResumen: Map<string, OrdenVentaLineasResumen>,
  bodegaDestinoLabels: Map<string, string>,
  slaByCuenta: Map<string, OvSlaConfig>,
): OrdenVentaOperadorRow {
  const resumen = lineasResumen.get(row.id_orden_venta) ?? {
    count: 0,
    cantidadKg: 0,
    total: 0,
  };
  const destino = row.id_bodega_destino
    ? (bodegaDestinoLabels.get(row.id_bodega_destino) ?? "—")
    : "—";
  const occTodas = collectOrdenesCompraCliente({
    ordenCompraHotel: row.orden_compra_hotel,
    origenCorreo: row.origen_correo,
  });
  const estado = normalizeEstadoOrdenVenta(row.estado);
  const slaConfig =
    slaByCuenta.get(row.codigo_cuenta) ?? normalizeOvSlaConfig(null, null);
  const estadoDesde =
    row.estado_desde || row.updated_at || row.created_at || row.fecha_pedido;
  const sla = computeOvSla(estado, estadoDesde, slaConfig);

  return {
    idOrdenVenta: row.id_orden_venta,
    venta: row.codigo,
    occ: occTodas[0] ?? "—",
    occTodas,
    cuenta: row.codigo_cuenta,
    comprador: row.id_comprador ? (compradorLabels.get(row.id_comprador) ?? "—") : "—",
    origenCorreo: row.origen_correo,
    productos: formatProductosResumen(resumen.count),
    cantidadKg: resumen.cantidadKg,
    total: resumen.total,
    estado,
    fecha: row.created_at || row.fecha_pedido,
    fechaEntrega: row.fecha_entrega?.trim() || null,
    ordenesTrabajo: countOrdenesTrabajo(row.origen_correo),
    destino,
    idBodega: row.id_bodega,
    idBodegaDestino: row.id_bodega_destino,
    slaStatus: sla.slaStatus,
    alertaStatus: sla.alertaStatus,
    minutosEnEstado: sla.minutosEnEstado,
    slaMinutos: slaConfig.slaMinutos,
    alertaMinutos: slaConfig.alertaMinutos,
    ...camposInicialesFilaOperador(row),
  };
}

// Confirmación y despacho operativo vía POST /ventas/ordenes/:id/emitir (API Nest).

export async function listOrdenesVenta(
  params: TenantListParams,
): Promise<OrdenVentaRow[]> {
  const limit = params.limit ?? DEFAULT_LIST_LIMIT;

  const rows = await runDomainQuery((client) => {
    const query = applyRecentOrdersFilter(
      applyTenantFilters(
        client
          .from("orden_venta")
          .select(ORDEN_VENTA_COLUMNS)
          .neq("estado", "cancelada"),
        params,
      ),
      "created_at",
    )
      .order("created_at", { ascending: false })
      .order("id_orden_venta", { ascending: false })
      .limit(limit);

    return query as unknown as Promise<{
      data: OrdenVentaRow[] | null;
      error: { message: string } | null;
    }>;
  });

  return sortOrdenesVentaPorCreacionDesc(rows).map((row) => ({
    ...row,
    estado: normalizeEstadoOrdenVenta(row.estado),
  }));
}

/**
 * Cuenta OV en por_confirmar visibles en el listado de ventas
 * (misma ventana de fecha que `listOrdenesVentaOperador`).
 */
export async function countOrdenesVentaPorConfirmar(
  codigoCuenta: string,
): Promise<number> {
  const codigo = requireCodigoCuenta(codigoCuenta);

  const result = await runDomainQuery<{ count: number }>((client) => {
    const query = applyRecentOrdersFilter(
      client
        .from("orden_venta")
        .select("*", { count: "exact", head: true })
        .eq("codigo_cuenta", codigo)
        .eq("estado", "por_confirmar"),
      "created_at",
    );

    return query.then(({ count, error }: { count: number | null; error: { message: string } | null }) => ({
      data: { count: count ?? 0 },
      error,
    }));
  });

  return result.count;
}

export async function listOrdenesVentaOperador(
  params: TenantListParams,
): Promise<OrdenVentaOperadorRow[]> {
  requireCodigoCuenta(params.codigoCuenta);

  const limit = params.limit ?? DEFAULT_LIST_LIMIT;

  const rows = await runDomainQuery<OrdenVentaOperadorListRow[]>((client) => {
    const query = applyRecentOrdersFilter(
      applyTenantFilters(
        client
          .from("orden_venta")
          .select(ORDEN_VENTA_OPERADOR_LIST_COLUMNS),
        // REQ-255: incluir cancelada (solo lectura en UI).
        params,
      ),
      "created_at",
    )
      .order("created_at", { ascending: false })
      .order("id_orden_venta", { ascending: false })
      .limit(limit);

    return query as unknown as Promise<{
      data: OrdenVentaOperadorListRow[] | null;
      error: { message: string } | null;
    }>;
  });

  return enrichOrdenesVentaOperador(
    sortOrdenesVentaPorCreacionDesc(rows),
  );
}

/** Una OV del listado operador (enriquecida como en `listOrdenesVentaOperador`). */
export async function getOrdenVentaOperadorById(params: {
  codigoCuenta: string;
  idOrdenVenta: string;
}): Promise<OrdenVentaOperadorRow | null> {
  const codigoCuenta = requireCodigoCuenta(params.codigoCuenta);
  const idOrdenVenta = params.idOrdenVenta.trim();
  if (!idOrdenVenta) {
    return null;
  }

  const row = await runDomainQuery<OrdenVentaOperadorListRow | null>(
    (client) => {
      const query = client
        .from("orden_venta")
        .select(ORDEN_VENTA_OPERADOR_LIST_COLUMNS)
        .eq("codigo_cuenta", codigoCuenta)
        .eq("id_orden_venta", idOrdenVenta)
        .maybeSingle();

      return query as unknown as Promise<{
        data: OrdenVentaOperadorListRow | null;
        error: { message: string } | null;
      }>;
    },
  );

  if (!row) {
    return null;
  }

  const [enriched] = await enrichOrdenesVentaOperador([row]);
  return enriched ?? null;
}

/**
 * Listado para jefe de bodega: OV recientes donde la bodega activa es origen
 * O destino (así no se pierden pedidos con origen en otra bodega de la cuenta).
 */
export async function listOrdenesVentaOperadorParaJefe(params: {
  codigoCuenta: string;
  idBodega: string;
  limit?: number;
}): Promise<OrdenVentaOperadorRow[]> {
  const codigoCuenta = requireCodigoCuenta(params.codigoCuenta);
  const idBodega = requireIdBodega(params.idBodega);
  const limit = params.limit ?? DEFAULT_LIST_LIMIT;

  const rows = await runDomainQuery<OrdenVentaOperadorListRow[]>((client) => {
    const query = applyRecentOrdersFilter(
      client
        .from("orden_venta")
        .select(ORDEN_VENTA_OPERADOR_LIST_COLUMNS)
        .eq("codigo_cuenta", codigoCuenta)
        .or(`id_bodega.eq.${idBodega},id_bodega_destino.eq.${idBodega}`),
      // REQ-255: incluir cancelada.
      "created_at",
    )
      .order("created_at", { ascending: false })
      .order("id_orden_venta", { ascending: false })
      .limit(limit);

    return query as unknown as Promise<{
      data: OrdenVentaOperadorListRow[] | null;
      error: { message: string } | null;
    }>;
  });

  return enrichOrdenesVentaOperador(sortOrdenesVentaPorCreacionDesc(rows));
}

async function enrichOrdenesVentaOperador(
  rows: OrdenVentaOperadorListRow[],
): Promise<OrdenVentaOperadorRow[]> {
  const compradorIds = rows
    .map((row) => row.id_comprador)
    .filter((id): id is string => Boolean(id));
  const destinoIds = rows
    .map((row) => row.id_bodega_destino)
    .filter((id): id is string => Boolean(id));
  const ordenIds = rows.map((row) => row.id_orden_venta);
  const cuentaCodigos = rows.map((row) => row.codigo_cuenta);

  const [compradorLabels, lineasResumen, bodegaDestinoLabels, slaByCuenta] =
    await Promise.all([
      fetchCompradorLabels(compradorIds),
      fetchLineasResumenByOrden(ordenIds),
      fetchBodegaDestinoLabels(destinoIds),
      fetchCuentaOvSlaByCodigo(cuentaCodigos),
    ]);

  const mapped = rows.map((row) =>
    mapOrdenVentaOperadorRow(
      row,
      compradorLabels,
      lineasResumen,
      bodegaDestinoLabels,
      slaByCuenta,
    ),
  );

  // REQ-151 / REQ-338: duplicado y correo partido sobre el lote cargado.
  return enrichOperadorListadoAnnotations(mapped, rows);
}
