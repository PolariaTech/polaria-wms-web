import {
  DEFAULT_LIST_LIMIT,
  requireCodigoCuenta,
  requireIdBodega,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import { formatKgEs } from "@/lib/utils/decimal-es";
import {
  listMovimientosInventarioApi,
  type MovimientoInventarioApiRow,
} from "@/modules/inventory/shared/services/inventory-api.service";
import { listWarehouseState } from "@/modules/inventory/shared/services/inventory.service";
import type { WarehouseStateRow } from "@/modules/inventory/shared/types/inventory.types";
import { listUbicacionesEstadoBodega } from "@/modules/warehouses/estado-bodega/services/estado-bodega.service";
import {
  resolveIdPaquete,
  resolveProductoNombre,
} from "@/modules/warehouses/estado-bodega/utils/estado-bodega-slot-content";

export type CajaRastreoEstado = "en_bodega" | "despachada" | "sin_ubicacion";

export interface CajaRastreableRow {
  idLote: string;
  codigoLote: string;
  idPaquete: string;
  productoNombre: string;
  cantidadLabel: string;
  ubicacionCodigo: string | null;
  estado: CajaRastreoEstado;
  estadoLabel: string;
  idProducto: string;
  updatedAt: string;
}

export interface CajaMovimientoRastreoRow {
  idMovimiento: string;
  tipoMovimiento: string;
  tipoLabel: string;
  cantidadLabel: string;
  origenCodigo: string | null;
  destinoCodigo: string | null;
  createdAt: string;
  createdAtLabel: string;
}

export interface CajaRastreoDetalle {
  caja: CajaRastreableRow;
  movimientos: CajaMovimientoRastreoRow[];
}

interface LoteHistoricoDbRow {
  id_lote: string;
  codigo_lote: string;
  id_producto: string;
  updated_at: string;
  producto:
    | {
        id_producto: string;
        sku: string | null;
        descripcion: string | null;
        metadatos_catalogo?: unknown;
      }
    | {
        id_producto: string;
        sku: string | null;
        descripcion: string | null;
        metadatos_catalogo?: unknown;
      }[]
    | null;
}

const TIPO_MOVIMIENTO_LABELS: Record<string, string> = {
  entrada: "Entrada",
  salida: "Salida",
  recepcion: "Recepción",
  despacho: "Despacho",
  transferencia: "Transferencia",
  ajuste_positivo: "Ajuste (+)",
  ajuste_negativo: "Ajuste (−)",
  merma: "Merma",
  reserva: "Reserva",
  liberacion_reserva: "Liberación reserva",
  consumo_ot: "Consumo OT",
  produccion_ot: "Producción OT",
};

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function formatTipoMovimiento(tipo: string): string {
  return TIPO_MOVIMIENTO_LABELS[tipo] ?? tipo;
}

function formatFechaHora(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function estadoLabel(estado: CajaRastreoEstado): string {
  if (estado === "en_bodega") return "En bodega";
  if (estado === "despachada") return "Despachada";
  return "Sin ubicación";
}

function productoNombreFromLote(row: LoteHistoricoDbRow): string {
  const producto = unwrapOne(row.producto);
  if (!producto) return "Producto";

  const fakeRow = {
    producto,
  } as WarehouseStateRow;

  return resolveProductoNombre(fakeRow) ?? producto.sku ?? "Producto";
}

function mapWarehouseStateToCaja(
  row: WarehouseStateRow,
  ubicacionById: Map<string, string>,
): CajaRastreableRow | null {
  if (!row.id_lote) return null;

  const lote = unwrapOne(row.lote);
  const codigoLote = lote?.codigo_lote?.trim() || row.id_lote.slice(0, 8);
  const idPaquete = resolveIdPaquete(codigoLote) ?? codigoLote;
  const cantidad = Number(row.cantidad);

  return {
    idLote: row.id_lote,
    codigoLote,
    idPaquete,
    productoNombre: resolveProductoNombre(row) ?? "Producto",
    cantidadLabel: Number.isFinite(cantidad)
      ? `${formatKgEs(cantidad)} kg`
      : `${row.cantidad} kg`,
    ubicacionCodigo: ubicacionById.get(row.id_ubicacion) ?? null,
    estado: "en_bodega",
    estadoLabel: estadoLabel("en_bodega"),
    idProducto: row.id_producto,
    updatedAt: row.updated_at,
  };
}

async function listLotesHistoricos(params: {
  codigoCuenta: string;
  idBodega: string;
  idLotes: string[];
}): Promise<LoteHistoricoDbRow[]> {
  if (params.idLotes.length === 0) return [];

  return runDomainQuery<LoteHistoricoDbRow[]>((client) => {
    const query = client
      .from("lote")
      .select(
        "id_lote,codigo_lote,id_producto,updated_at,producto:producto(id_producto,sku,descripcion,metadatos_catalogo)",
      )
      .eq("codigo_cuenta", params.codigoCuenta)
      .eq("id_bodega", params.idBodega)
      .in("id_lote", params.idLotes)
      .limit(DEFAULT_LIST_LIMIT);

    return query as unknown as Promise<{
      data: LoteHistoricoDbRow[] | null;
      error: { message: string } | null;
    }>;
  });
}

function latestMovimientoByLote(
  movimientos: MovimientoInventarioApiRow[],
): Map<string, MovimientoInventarioApiRow> {
  const map = new Map<string, MovimientoInventarioApiRow>();
  for (const mov of movimientos) {
    if (!mov.idLote) continue;
    if (!map.has(mov.idLote)) {
      map.set(mov.idLote, mov);
    }
  }
  return map;
}

/** Lista cajas de la bodega (stock actual + historial, incl. despachadas). */
export async function listCajasRastreables(params: {
  codigoCuenta: string;
  idBodega: string;
}): Promise<CajaRastreableRow[]> {
  const codigoCuenta = requireCodigoCuenta(params.codigoCuenta);
  const idBodega = requireIdBodega(params.idBodega);

  const [warehouseRows, ubicaciones, movimientos] = await Promise.all([
    listWarehouseState({ codigoCuenta, idBodega, limit: 500 }),
    listUbicacionesEstadoBodega(idBodega),
    listMovimientosInventarioApi({ codigoCuenta, idBodega }),
  ]);

  const ubicacionById = new Map(
    ubicaciones.map((row) => [row.id_ubicacion, row.codigo]),
  );

  const cajasByLote = new Map<string, CajaRastreableRow>();

  for (const row of warehouseRows) {
    const caja = mapWarehouseStateToCaja(row, ubicacionById);
    if (!caja) continue;
    cajasByLote.set(caja.idLote, caja);
  }

  const lotesEnStock = new Set(cajasByLote.keys());
  const lotesHistoricos = Array.from(
    new Set(
      movimientos
        .map((mov) => mov.idLote)
        .filter((id): id is string => Boolean(id) && !lotesEnStock.has(id)),
    ),
  );

  const latestByLote = latestMovimientoByLote(movimientos);
  const lotes = await listLotesHistoricos({
    codigoCuenta,
    idBodega,
    idLotes: lotesHistoricos,
  });

  for (const lote of lotes) {
    const latest = latestByLote.get(lote.id_lote);
    const estado: CajaRastreoEstado =
      latest?.tipoMovimiento === "despacho" ? "despachada" : "sin_ubicacion";
    const codigoLote = lote.codigo_lote.trim() || lote.id_lote.slice(0, 8);
    const cantidad = latest ? Number(latest.cantidad) : NaN;

    cajasByLote.set(lote.id_lote, {
      idLote: lote.id_lote,
      codigoLote,
      idPaquete: resolveIdPaquete(codigoLote) ?? codigoLote,
      productoNombre: productoNombreFromLote(lote),
      cantidadLabel: Number.isFinite(cantidad)
        ? `${formatKgEs(cantidad)} kg`
        : "—",
      ubicacionCodigo:
        latest?.idUbicacionDestino
          ? (ubicacionById.get(latest.idUbicacionDestino) ?? null)
          : null,
      estado,
      estadoLabel: estadoLabel(estado),
      idProducto: lote.id_producto,
      updatedAt: latest?.createdAt ?? lote.updated_at,
    });
  }

  return Array.from(cajasByLote.values()).sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}

/** Detalle de una caja: ubicación actual + recorrido de movimientos. */
export async function getCajaRastreoDetalle(params: {
  codigoCuenta: string;
  idBodega: string;
  idLote: string;
  caja?: CajaRastreableRow | null;
}): Promise<CajaRastreoDetalle> {
  const codigoCuenta = requireCodigoCuenta(params.codigoCuenta);
  const idBodega = requireIdBodega(params.idBodega);
  const idLote = params.idLote.trim();

  if (!idLote) {
    throw new Error("La caja seleccionada no es válida.");
  }

  const [movimientos, ubicaciones, cajas] = await Promise.all([
    listMovimientosInventarioApi({ codigoCuenta, idBodega, idLote }),
    listUbicacionesEstadoBodega(idBodega),
    params.caja
      ? Promise.resolve([params.caja])
      : listCajasRastreables({ codigoCuenta, idBodega }),
  ]);

  const ubicacionById = new Map(
    ubicaciones.map((row) => [row.id_ubicacion, row.codigo]),
  );

  const caja =
    cajas.find((row) => row.idLote === idLote) ??
    params.caja ??
    null;

  if (!caja) {
    throw new Error("No se encontró la caja seleccionada.");
  }

  const historial: CajaMovimientoRastreoRow[] = movimientos.map((mov) => ({
    idMovimiento: mov.idMovimientoInventario,
    tipoMovimiento: mov.tipoMovimiento,
    tipoLabel: formatTipoMovimiento(mov.tipoMovimiento),
    cantidadLabel: `${formatKgEs(Number(mov.cantidad))} kg`,
    origenCodigo: mov.idUbicacionOrigen
      ? (ubicacionById.get(mov.idUbicacionOrigen) ?? null)
      : null,
    destinoCodigo: mov.idUbicacionDestino
      ? (ubicacionById.get(mov.idUbicacionDestino) ?? null)
      : null,
    createdAt: mov.createdAt,
    createdAtLabel: formatFechaHora(mov.createdAt),
  }));

  // Recorrido cronológico (más antiguo → más reciente)
  historial.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return { caja, movimientos: historial };
}
