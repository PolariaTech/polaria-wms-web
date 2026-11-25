import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { listAlmacenamientoVentaUbicacionIds } from "@/modules/warehouses/estado-bodega/utils/estado-bodega-zone-ubicaciones";
import type { UbicacionEstadoBodegaDbRow } from "@/modules/warehouses/estado-bodega/types/estado-bodega.types";
import type { WarehouseStateRow } from "@/modules/inventory/shared/types/inventory.types";
import {
  mapLatestPrecioProductoById,
  type PrecioProductoRow,
} from "../utils/sales-precio";
import {
  isCatalogoTipoProductoMercancia,
  parseCatalogoMetadatos,
} from "@/modules/admin-panel/catalogo/constants/catalogo-producto";
import { resolveNombreProductoVenta } from "../utils/producto-venta-nombre";
import {
  UNIDAD_MEDIDA_VENTA_DEFAULT,
  type ProductoVentaOption,
} from "../types/sales.types";
import {
  getProductosVentaCatalogoCache,
  setProductosVentaCatalogoCache,
} from "./sales-catalog-cache.server";
import {
  resolveTenantSchemaForCuenta,
  tenantFrom,
  type TenantFrom,
} from "./sales-catalog-tenant.server";

export { resolveTenantSchemaForCuenta };

function isProductoMercanciaVenta(row: {
  metadatos_catalogo?: unknown;
}): boolean {
  const meta = parseCatalogoMetadatos(row.metadatos_catalogo);
  return isCatalogoTipoProductoMercancia(meta.tipo_producto);
}

const WAREHOUSE_STOCK_VENTA_SELECT =
  "id_producto,id_bodega,id_ubicacion,cantidad,cantidad_reservada," +
  "producto:producto(id_producto,sku,descripcion,id_cliente,metadatos_catalogo)";

const UBICACION_VENTA_SELECT =
  "id_ubicacion,id_bodega,tipo_ubicacion(codigo,es_recepcion,es_almacenamiento,es_picking)";

const PRODUCTO_CATALOGO_SELECT =
  "id_producto,sku,descripcion,id_cliente,unidad_medida,metadatos_catalogo,esta_activo";

interface WarehouseStockVentaRow {
  id_producto: string;
  id_bodega: string;
  id_ubicacion: string;
  cantidad: string | number;
  cantidad_reservada: string | number;
  producto: WarehouseStateRow["producto"];
}

interface ProductoCatalogoRow {
  id_producto: string;
  sku: string | null;
  descripcion: string | null;
  id_cliente: string | null;
  unidad_medida?: string | null;
  metadatos_catalogo?: unknown;
  esta_activo?: boolean | null;
}

function parseCantidadKg(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapProductoToOption(input: {
  idProducto: string;
  codigo: string;
  nombre: string;
  idCliente: string | null;
  idBodega: string;
  kgDisponible: number;
  precioUnitario: number;
  unidadMedida: string;
}): ProductoVentaOption {
  return {
    idProducto: input.idProducto,
    label: `${input.nombre} (${input.codigo})`,
    idCliente: input.idCliente,
    idBodega: input.idBodega,
    codigo: input.codigo,
    nombre: input.nombre,
    kgDisponible: input.kgDisponible,
    precioUnitario: input.precioUnitario,
    unidadMedida: input.unidadMedida.trim() || UNIDAD_MEDIDA_VENTA_DEFAULT,
  };
}

async function fetchPreciosProductoMap(
  from: (table: string) => TenantFrom,
  codigoCuenta: string,
  idProductos: string[],
): Promise<Map<string, number>> {
  const uniqueIds = [...new Set(idProductos.map((id) => id.trim()).filter(Boolean))];
  if (uniqueIds.length === 0) return new Map();

  const { data, error } = await from("precio_producto")
    .select("id_producto,precio,fecha_aplicacion")
    .eq("codigo_cuenta", codigoCuenta)
    .in("id_producto", uniqueIds)
    .order("fecha_aplicacion", { ascending: false })
    .limit(Math.min(Math.max(uniqueIds.length * 20, uniqueIds.length), 1000));

  if (error) {
    throw new Error(error.message);
  }

  return mapLatestPrecioProductoById((data ?? []) as PrecioProductoRow[]);
}

/** Solo claves de catálogo para IA (sin stock). Evita warehouse_state y el filtro de bodega. */
export async function listProductoCatalogoClavesServer(
  codigoCuenta: string,
): Promise<string[]> {
  const cuenta = codigoCuenta.trim();
  if (!cuenta) return [];

  const admin = getSupabaseAdminClient();
  if (!admin) {
    throw new Error("Supabase admin no configurado.");
  }

  const schemaName = await resolveTenantSchemaForCuenta(admin, cuenta);
  const from = tenantFrom(admin, schemaName);

  const { data, error } = await from("producto")
    .select("id_producto,sku,descripcion,metadatos_catalogo,esta_activo")
    .eq("codigo_cuenta", cuenta)
    .eq("esta_activo", true)
    .order("descripcion", { ascending: true })
    .limit(1000);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as ProductoCatalogoRow[])
    .filter(isProductoMercanciaVenta)
    .map((row) => {
      const codigo = row.sku?.trim() || row.id_producto?.slice(0, 8) || "";
      const nombre = resolveNombreProductoVenta(row, codigo);
      return `${nombre} (${codigo})`;
    });
}

/** Catálogo completo de productos de la cuenta + kg disponibles (puede ser 0). */
export async function listProductosVentaCatalogoServer(
  codigoCuenta: string,
): Promise<ProductoVentaOption[]> {
  const cuenta = codigoCuenta.trim();
  if (!cuenta) return [];

  const cached = getProductosVentaCatalogoCache(cuenta);
  if (cached) {
    return cached as ProductoVentaOption[];
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    throw new Error("Supabase admin no configurado.");
  }

  const schemaName = await resolveTenantSchemaForCuenta(admin, cuenta);
  const from = tenantFrom(admin, schemaName);

  const [bodegaRes, productoRes] = await Promise.all([
    from("bodega")
      .select("id_bodega")
      .eq("codigo_cuenta", cuenta)
      .eq("esta_activa", true)
      .order("nombre", { ascending: true })
      .limit(50),
    from("producto")
      .select(PRODUCTO_CATALOGO_SELECT)
      .eq("codigo_cuenta", cuenta)
      .eq("esta_activo", true)
      .order("descripcion", { ascending: true })
      .limit(1000),
  ]);

  if (bodegaRes.error) throw new Error(bodegaRes.error.message);
  if (productoRes.error) throw new Error(productoRes.error.message);

  const bodegaIds = (bodegaRes.data ?? [])
    .map((row) => row.id_bodega)
    .filter((id): id is string => Boolean(id?.trim()));
  const defaultBodegaId = bodegaIds[0] ?? "";

  const productos = ((productoRes.data ?? []) as ProductoCatalogoRow[]).filter(
    isProductoMercanciaVenta,
  );
  if (productos.length === 0) {
    setProductosVentaCatalogoCache(cuenta, []);
    return [];
  }

  const stockPromise =
    bodegaIds.length > 0
      ? from("warehouse_state")
          .select(WAREHOUSE_STOCK_VENTA_SELECT)
          .in("id_bodega", bodegaIds)
          .limit(2000)
      : Promise.resolve({ data: null, error: null });
  const ubicacionPromise =
    bodegaIds.length > 0
      ? from("ubicacion")
          .select(UBICACION_VENTA_SELECT)
          .in("id_bodega", bodegaIds)
          .eq("esta_activa", true)
          .limit(500)
      : Promise.resolve({ data: null, error: null });

  const [stockRes, ubicacionRes] = await Promise.all([
    stockPromise,
    ubicacionPromise,
  ]);

  if (stockRes.error) throw new Error(stockRes.error.message);
  if (ubicacionRes.error) throw new Error(ubicacionRes.error.message);

  let stockRows = (stockRes.data ?? []) as unknown as WarehouseStockVentaRow[];
  if (stockRows.length === 0) {
    const fallback = await from("warehouse_state")
      .select(WAREHOUSE_STOCK_VENTA_SELECT)
      .eq("codigo_cuenta", cuenta)
      .limit(2000);
    if (fallback.error) throw new Error(fallback.error.message);
    stockRows = (fallback.data ?? []) as unknown as WarehouseStockVentaRow[];
  }

  const ubicaciones = (ubicacionRes.data ??
    []) as unknown as UbicacionEstadoBodegaDbRow[];
  const almacenamientoUbicacionIds =
    listAlmacenamientoVentaUbicacionIds(ubicaciones);
  const filtrarPorZona = ubicaciones.length > 0;

  const kgByProducto = new Map<
    string,
    { kgDisponible: number; idBodega: string }
  >();

  for (const row of stockRows) {
    if (
      filtrarPorZona &&
      !almacenamientoUbicacionIds.has(row.id_ubicacion)
    ) {
      continue;
    }

    const disponible = Math.max(
      0,
      parseCantidadKg(row.cantidad) - parseCantidadKg(row.cantidad_reservada),
    );
    const current = kgByProducto.get(row.id_producto);
    kgByProducto.set(row.id_producto, {
      kgDisponible: (current?.kgDisponible ?? 0) + disponible,
      idBodega: current?.idBodega ?? row.id_bodega,
    });
  }

  const productoIds = productos.map((row) => row.id_producto);
  const precioMap = await fetchPreciosProductoMap(from, cuenta, productoIds);

  const options = productos
    .map((row) => {
      const stock = kgByProducto.get(row.id_producto);
      const codigo = row.sku?.trim() || row.id_producto.slice(0, 8);
      const nombre = resolveNombreProductoVenta(row, codigo);

      return mapProductoToOption({
        idProducto: row.id_producto,
        codigo,
        nombre,
        idCliente: row.id_cliente ?? null,
        idBodega: stock?.idBodega || defaultBodegaId,
        kgDisponible: stock?.kgDisponible ?? 0,
        precioUnitario: precioMap.get(row.id_producto) ?? 0,
        unidadMedida: row.unidad_medida?.trim() || UNIDAD_MEDIDA_VENTA_DEFAULT,
      });
    })
    .filter((row) => Boolean(row.idBodega))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  setProductosVentaCatalogoCache(cuenta, options);
  return options;
}
