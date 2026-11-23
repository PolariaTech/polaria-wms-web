import {
  requireCodigoCuenta,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { normalizeEstadoOrdenVenta } from "../constants/sales-status";
import type {
  OrdenVentaDetalleRow,
  OrdenVentaLineaRow,
} from "../types/sales.types";
import { materializeOrdenVentaDesdeOrigenSiVacia } from "./materializar-lineas-desde-origen";
import { mapDenominacionDetalleFields as mapDenominacion } from "./map-denominacion-detalle";
import { listProductosVentaCatalogo } from "./sales-catalogo-venta.service";
import { fetchBodegaDestinoLabels } from "./sales-operador-labels";
import {
  ORDEN_VENTA_DETALLE_SELECT,
  parseCantidadKg,
  type CompradorDetalleDbRel,
  type OrdenVentaDetalleDbRow,
  type OrdenVentaLineaDetalleDbRow,
} from "./sales-orden-venta.db";

function resolveCompradorRel(
  comprador: OrdenVentaDetalleDbRow["comprador"],
): CompradorDetalleDbRel | null {
  if (!comprador) return null;
  return Array.isArray(comprador) ? (comprador[0] ?? null) : comprador;
}

function resolveOrdenVentaLineaProducto(
  producto: OrdenVentaLineaDetalleDbRow["producto"],
): OrdenVentaLineaRow["producto"] {
  if (!producto) return null;
  return Array.isArray(producto) ? (producto[0] ?? null) : producto;
}

function mapOrdenVentaLineaDetalleRow(
  row: OrdenVentaLineaDetalleDbRow,
): OrdenVentaLineaRow {
  const matchRaw = row.match_producto;
  const matchProducto =
    matchRaw &&
    typeof matchRaw === "object" &&
    !Array.isArray(matchRaw) &&
    typeof (matchRaw as { textoCliente?: unknown }).textoCliente === "string"
      ? (matchRaw as NonNullable<OrdenVentaLineaRow["match_producto"]>)
      : null;

  return {
    id_linea_orden_venta: row.id_linea_orden_venta,
    id_producto: row.id_producto,
    cantidad_pedida: parseCantidadKg(row.cantidad_pedida),
    precio_unitario: parseCantidadKg(row.precio_unitario),
    cajas:
      row.cajas == null || row.cajas === ""
        ? null
        : parseCantidadKg(row.cajas) || null,
    presentacion: row.presentacion?.trim() || null,
    unidad_medida: row.unidad_medida?.trim() || null,
    match_producto: matchProducto,
    producto: resolveOrdenVentaLineaProducto(row.producto),
  };
}

function mapOrdenVentaDetalleRow(
  row: OrdenVentaDetalleDbRow,
  bodegaLabels: Map<string, string>,
): OrdenVentaDetalleRow {
  const { comprador, orden_venta_linea, ...orden } = row;
  const compradorRel = resolveCompradorRel(comprador);
  const denominacion = mapDenominacion({ compradorApodo: compradorRel?.apodo, compradorOverride: compradorRel?.denominacion_comercial_override, ordenOverride: orden.denominacion_comercial_override });

  return {
    ...orden,
    estado: normalizeEstadoOrdenVenta(orden.estado),
    comprador_nombre: compradorRel?.nombre?.trim() || null,
    comprador_codigo: compradorRel?.codigo?.trim() || null,
    comprador_razon_social: compradorRel?.razon_social?.trim() || null,
    ...denominacion, comprador_rfc: compradorRel?.rfc?.trim() || null,
    bodega_nombre: bodegaLabels.get(orden.id_bodega) ?? null,
    bodega_destino_nombre: orden.id_bodega_destino
      ? (bodegaLabels.get(orden.id_bodega_destino) ?? null)
      : null,
    lineas: (orden_venta_linea ?? []).map(mapOrdenVentaLineaDetalleRow),
  };
}

export interface GetOrdenVentaDetalleParams {
  codigoCuenta: string;
  idOrdenVenta: string;
}

export async function getOrdenVentaDetalle(
  params: GetOrdenVentaDetalleParams,
): Promise<OrdenVentaDetalleRow> {
  const codigoCuenta = requireCodigoCuenta(params.codigoCuenta);
  const idOrdenVenta = params.idOrdenVenta.trim();

  if (!idOrdenVenta) {
    throw new DomainServiceError(
      "La orden de venta no es válida.",
      "INVALID_ARGUMENT",
    );
  }

  // OVs del bot/tercero: a veces llegan solo con origen_correo.
  await materializeOrdenVentaDesdeOrigenSiVacia({
    codigoCuenta,
    idOrdenVenta,
    listProductos: listProductosVentaCatalogo,
  });

  const row = await runDomainQuery<OrdenVentaDetalleDbRow | null>((client) => {
    const query = client
      .from("orden_venta")
      .select(ORDEN_VENTA_DETALLE_SELECT)
      .eq("codigo_cuenta", codigoCuenta)
      .eq("id_orden_venta", idOrdenVenta)
      .maybeSingle();

    return query as unknown as Promise<{
      data: OrdenVentaDetalleDbRow | null;
      error: { message: string } | null;
    }>;
  });

  if (!row) {
    throw new DomainServiceError(
      "No se encontró la orden de venta.",
      "NOT_FOUND",
    );
  }

  const bodegaIds = [row.id_bodega, row.id_bodega_destino].filter(
    (id): id is string => Boolean(id?.trim()),
  );
  const bodegaLabels = await fetchBodegaDestinoLabels(bodegaIds);

  return mapOrdenVentaDetalleRow(row, bodegaLabels);
}
