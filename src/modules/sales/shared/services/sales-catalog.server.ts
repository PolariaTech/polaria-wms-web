import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolveProductoNombre } from "@/modules/warehouses/estado-bodega/utils/estado-bodega-slot-content";
import { listAlmacenamientoVentaUbicacionIds } from "@/modules/warehouses/estado-bodega/utils/estado-bodega-zone-ubicaciones";
import type { UbicacionEstadoBodegaDbRow } from "@/modules/warehouses/estado-bodega/types/estado-bodega.types";
import type { WarehouseStateRow } from "@/modules/inventory/shared/types/inventory.types";
import { resolvePrecioUnitarioFromMetadatos } from "../utils/sales-precio";
import type { ProductoVentaOption } from "../types/sales.types";

const WAREHOUSE_STOCK_VENTA_SELECT =
  "id_producto,id_bodega,id_ubicacion,cantidad,cantidad_reservada," +
  "producto:producto(id_producto,sku,descripcion,id_cliente,metadatos_catalogo)";

const UBICACION_VENTA_SELECT =
  "id_ubicacion,id_bodega,tipo_ubicacion(codigo,es_recepcion,es_almacenamiento,es_picking)";

interface WarehouseStockVentaRow {
  id_producto: string;
  id_bodega: string;
  id_ubicacion: string;
  cantidad: string | number;
  cantidad_reservada: string | number;
  producto: WarehouseStateRow["producto"];
}

function parseCantidadKg(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

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
  return row ?? null;
}

function mapStockRowToProductoOption(
  idProducto: string,
  stock: { kgDisponible: number; sampleRow: WarehouseStockVentaRow },
): ProductoVentaOption {
  const productoRel = unwrapProductoRel(stock.sampleRow.producto);
  const codigo = productoRel?.sku?.trim() || idProducto.slice(0, 8);
  const nombre =
    resolveProductoNombre(stock.sampleRow as WarehouseStateRow) ||
    productoRel?.descripcion?.trim() ||
    `Producto ${codigo}`;

  return {
    idProducto,
    label: `${nombre} (${codigo})`,
    idCliente: productoRel?.id_cliente ?? null,
    idBodega: stock.sampleRow.id_bodega,
    codigo,
    nombre,
    kgDisponible: stock.kgDisponible,
    precioUnitario: resolvePrecioUnitarioFromMetadatos(
      productoRel?.metadatos_catalogo,
    ),
  };
}

/** Catálogo de venta leyendo warehouse_state con service role (sin RLS del navegador). */
export async function listProductosVentaCatalogoServer(
  codigoCuenta: string,
): Promise<ProductoVentaOption[]> {
  const cuenta = codigoCuenta.trim();
  if (!cuenta) return [];

  const admin = getSupabaseAdminClient();
  if (!admin) {
    throw new Error("Supabase admin no configurado.");
  }

  const { data: bodegaRows, error: bodegaError } = await admin
    .from("bodega")
    .select("id_bodega")
    .eq("codigo_cuenta", cuenta)
    .eq("esta_activa", true)
    .order("nombre", { ascending: true })
    .limit(50);

  if (bodegaError) {
    throw new Error(bodegaError.message);
  }

  const bodegaIds = (bodegaRows ?? [])
    .map((row) => row.id_bodega)
    .filter((id): id is string => Boolean(id?.trim()));

  let stockRows: WarehouseStockVentaRow[] = [];

  if (bodegaIds.length > 0) {
    const { data, error } = await admin
      .from("warehouse_state")
      .select(WAREHOUSE_STOCK_VENTA_SELECT)
      .in("id_bodega", bodegaIds)
      .limit(500);

    if (error) {
      throw new Error(error.message);
    }

    stockRows = (data ?? []) as WarehouseStockVentaRow[];
  }

  if (stockRows.length === 0) {
    const { data, error } = await admin
      .from("warehouse_state")
      .select(WAREHOUSE_STOCK_VENTA_SELECT)
      .eq("codigo_cuenta", cuenta)
      .limit(500);

    if (error) {
      throw new Error(error.message);
    }

    stockRows = (data ?? []) as WarehouseStockVentaRow[];
  }

  let ubicaciones: UbicacionEstadoBodegaDbRow[] = [];
  if (bodegaIds.length > 0) {
    const { data, error } = await admin
      .from("ubicacion")
      .select(UBICACION_VENTA_SELECT)
      .in("id_bodega", bodegaIds)
      .eq("esta_activa", true)
      .limit(500);

    if (error) {
      throw new Error(error.message);
    }

    ubicaciones = (data ?? []) as UbicacionEstadoBodegaDbRow[];
  }

  const almacenamientoUbicacionIds =
    listAlmacenamientoVentaUbicacionIds(ubicaciones);
  const filtrarPorZona = ubicaciones.length > 0;

  const kgByProducto = new Map<
    string,
    { kgDisponible: number; sampleRow: WarehouseStockVentaRow }
  >();

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

  return [...kgByProducto.entries()]
    .map(([idProducto, stock]) => mapStockRowToProductoOption(idProducto, stock))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}
