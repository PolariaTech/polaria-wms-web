import { listOrdenesTrabajoApi } from "@/modules/operations";
import { listWarehouseState } from "@/modules/inventory/shared/services/inventory.service";
import type { OrdenVentaDetalleRow } from "@/modules/sales/shared/types/sales.types";
import { extractOvCodigoFromText } from "@/modules/operations/shared/utils/orden-trabajo-api.mapper";

export interface StockUbicacionRow {
  id_ubicacion: string;
  id_producto: string;
  cantidad: string | number;
  cantidad_reservada: string | number;
}

function parseCantidadKg(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function buildCantidadPedidaByProducto(
  ordenDetalle: OrdenVentaDetalleRow,
): Map<string, number> {
  const cantidadByProducto = new Map<string, number>();

  for (const linea of ordenDetalle.lineas ?? []) {
    const idProducto = linea.id_producto?.trim();
    const cantidad = Number(linea.cantidad_pedida);
    if (!idProducto || !Number.isFinite(cantidad) || cantidad <= 0) continue;
    cantidadByProducto.set(
      idProducto,
      (cantidadByProducto.get(idProducto) ?? 0) + cantidad,
    );
  }

  return cantidadByProducto;
}

/** Prioriza reserva que cubre la OV y, en empate, la más cercana a la cantidad pedida. */
export function scoreUbicacionStockParaVenta(
  row: StockUbicacionRow,
  cantidadPedida: number,
): number {
  const reservado = parseCantidadKg(row.cantidad_reservada);
  const cantidad = parseCantidadKg(row.cantidad);

  let score = 0;
  if (reservado > 0) score += 10_000;
  if (cantidadPedida > 0 && reservado >= cantidadPedida) score += 5_000;
  if (cantidadPedida > 0 && reservado > 0) {
    score += 1_000 - Math.abs(reservado - cantidadPedida);
  }
  if (cantidad > 0) score += 100;
  score += reservado;
  return score;
}

export function pickMejorUbicacionStockParaVenta(
  rows: StockUbicacionRow[],
  cantidadPedidaByProducto: Map<string, number>,
): string | null {
  if (rows.length === 0) return null;

  const ranked = [...rows].sort((a, b) => {
    const scoreA = scoreUbicacionStockParaVenta(
      a,
      cantidadPedidaByProducto.get(a.id_producto) ?? 0,
    );
    const scoreB = scoreUbicacionStockParaVenta(
      b,
      cantidadPedidaByProducto.get(b.id_producto) ?? 0,
    );
    return scoreB - scoreA;
  });

  return ranked[0]?.id_ubicacion ?? null;
}

export function resolveOrigenDesdeStockAlmacenamiento(
  stock: StockUbicacionRow[],
  ordenDetalle: OrdenVentaDetalleRow,
  almacenUbicacionIds: Set<string>,
): string | null {
  const productIds = new Set(
    (ordenDetalle.lineas ?? []).map((linea) => linea.id_producto),
  );
  if (productIds.size === 0) return null;

  const cantidadPedidaByProducto = buildCantidadPedidaByProducto(ordenDetalle);

  const enAlmacen = stock.filter(
    (row) =>
      almacenUbicacionIds.has(row.id_ubicacion) &&
      productIds.has(row.id_producto),
  );

  const conReserva = enAlmacen.filter(
    (row) => parseCantidadKg(row.cantidad_reservada) > 0,
  );
  const fromReserva = pickMejorUbicacionStockParaVenta(
    conReserva,
    cantidadPedidaByProducto,
  );
  if (fromReserva) return fromReserva;

  const conStock = enAlmacen.filter((row) => parseCantidadKg(row.cantidad) > 0);
  return pickMejorUbicacionStockParaVenta(conStock, cantidadPedidaByProducto);
}

function ordenMatchesOv(
  idOrdenVenta: string,
  ovCodigo: string | null | undefined,
  orden: {
    idOrdenVenta?: string | null;
    observaciones: string | null;
  },
): boolean {
  if (orden.idOrdenVenta?.trim() === idOrdenVenta.trim()) {
    return true;
  }

  const codigo = ovCodigo?.trim().toUpperCase();
  if (!codigo) return false;

  const fromObs = extractOvCodigoFromText(orden.observaciones);
  return fromObs?.toUpperCase() === codigo;
}

async function resolveFromOrdenesTrabajo(params: {
  codigoCuenta: string;
  idBodega: string;
  idOrdenVenta: string;
  ovCodigo?: string | null;
}): Promise<string | null> {
  const ordenes = await listOrdenesTrabajoApi({
    codigoCuenta: params.codigoCuenta,
    idBodega: params.idBodega,
  });

  const matches = ordenes.filter(
    (orden) =>
      orden.idUbicacionOrigen?.trim() &&
      ordenMatchesOv(params.idOrdenVenta, params.ovCodigo, orden),
  );

  if (matches.length === 0) return null;

  const ordenadas = [...matches].sort((a, b) => {
    const score = (orden: (typeof matches)[number]) => {
      let value = 0;
      if (orden.idUbicacionDestino?.trim()) value += 100;
      if (orden.idAsignado?.trim()) value += 10;
      return value;
    };
    const diff = score(b) - score(a);
    if (diff !== 0) return diff;
    return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
  });

  return ordenadas[0]?.idUbicacionOrigen?.trim() ?? null;
}

async function resolveFromStockAlmacenamiento(params: {
  codigoCuenta: string;
  idBodega: string;
  ordenDetalle: OrdenVentaDetalleRow;
  almacenUbicacionIds: Set<string>;
}): Promise<string | null> {
  const stock = await listWarehouseState({
    codigoCuenta: params.codigoCuenta,
    idBodega: params.idBodega,
    limit: 500,
  });

  return resolveOrigenDesdeStockAlmacenamiento(
    stock,
    params.ordenDetalle,
    params.almacenUbicacionIds,
  );
}

function ubicacionTieneStockOv(
  idUbicacion: string,
  stock: StockUbicacionRow[],
  ordenDetalle: OrdenVentaDetalleRow,
  almacenUbicacionIds: Set<string>,
): boolean {
  if (!almacenUbicacionIds.has(idUbicacion)) return false;

  const productIds = new Set(
    (ordenDetalle.lineas ?? []).map((linea) => linea.id_producto),
  );

  return stock.some(
    (row) =>
      row.id_ubicacion === idUbicacion &&
      productIds.has(row.id_producto) &&
      (parseCantidadKg(row.cantidad_reservada) > 0 ||
        parseCantidadKg(row.cantidad) > 0),
  );
}

export async function resolveSalidaOrigenUbicacion(params: {
  codigoCuenta: string;
  idBodega: string;
  idOrdenVenta: string;
  ovCodigo?: string | null;
  ordenDetalle?: OrdenVentaDetalleRow | null;
  almacenUbicacionIds: Set<string>;
  prefillUbicacionOrigen?: string | null;
}): Promise<string | null> {
  if (params.ordenDetalle) {
    const fromStock = await resolveFromStockAlmacenamiento({
      codigoCuenta: params.codigoCuenta,
      idBodega: params.idBodega,
      ordenDetalle: params.ordenDetalle,
      almacenUbicacionIds: params.almacenUbicacionIds,
    });
    if (fromStock) return fromStock;
  }

  const prefill = params.prefillUbicacionOrigen?.trim();
  if (prefill && params.ordenDetalle) {
    const stock = await listWarehouseState({
      codigoCuenta: params.codigoCuenta,
      idBodega: params.idBodega,
      limit: 500,
    });
    if (
      ubicacionTieneStockOv(
        prefill,
        stock,
        params.ordenDetalle,
        params.almacenUbicacionIds,
      )
    ) {
      return prefill;
    }
  } else if (prefill) {
    return prefill;
  }

  return resolveFromOrdenesTrabajo({
    codigoCuenta: params.codigoCuenta,
    idBodega: params.idBodega,
    idOrdenVenta: params.idOrdenVenta,
    ovCodigo: params.ovCodigo,
  });
}
