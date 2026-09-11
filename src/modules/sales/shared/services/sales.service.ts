import {
  applyTenantFilters,
  applyRecentOrdersFilter,
  DEFAULT_LIST_LIMIT,
  requireCodigoCuenta,
  requireIdBodega,
  runDomainMutation,
  type TenantListParams,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { listAlmacenamientoVentaUbicacionIds } from "@/modules/warehouses/estado-bodega/utils/estado-bodega-zone-ubicaciones";
import type { UbicacionEstadoBodegaDbRow } from "@/modules/warehouses/estado-bodega/types/estado-bodega.types";
import type { WarehouseStateRow } from "@/modules/inventory/shared/types/inventory.types";
import { puedeEditarOrdenVenta } from "../constants/sales-status";
import { resolveNombreProductoVenta } from "../utils/producto-venta-nombre";
import {
  mapLatestPrecioProductoById,
  type PrecioProductoRow,
} from "../utils/sales-precio";
import {
  UNIDAD_MEDIDA_VENTA_DEFAULT,
  type CreateOrdenVentaInput,
  type OrdenVentaDetalleRow,
  type OrdenVentaLineaRow,
  type OrdenVentaOperadorRow,
  type OrdenVentaRow,
  type ProductoVentaOption,
  type UpdateOrdenVentaInput,
} from "../types/sales.types";

/** PostgREST GET `.in()` explota la URL con ~1000 UUIDs; tandas cortas evitan 400. */
const ORDEN_VENTA_LINEA_IN_CHUNK = 80;

const ORDEN_VENTA_COLUMNS =
  "id_orden_venta,codigo_cuenta,id_bodega,id_cliente,id_comprador,id_planta,id_creador,id_bodega_destino,codigo,estado,fecha_pedido,observaciones,created_at,updated_at";

const COMPRADOR_COLUMNS = "id_comprador,nombre";

const ORDEN_VENTA_DETALLE_FLAT_COLUMNS =
  "prioridad,orden_compra_hotel,centro_consumo,vendedor,moneda,bodega_destino_label,direccion_entrega,anden,contacto_entrega,telefono_contacto,turno,hora_salida,chofer,unidad,notas_lineas,notas_almacen,fecha_entrega,ventana_desde,ventana_hasta,acepta_sustituciones,requiere_lote,registrar_temperatura,origen_texto,origen_archivos";

const ORDEN_VENTA_DETALLE_SELECT =
  `${ORDEN_VENTA_COLUMNS},${ORDEN_VENTA_DETALLE_FLAT_COLUMNS},` +
  "comprador:comprador(nombre,codigo)," +
  "orden_venta_linea(id_linea_orden_venta,id_producto,cantidad_pedida,precio_unitario,cajas,presentacion,producto(sku,descripcion,metadatos_catalogo))";

interface OrdenVentaLineaDetalleDbRow {
  id_linea_orden_venta: string;
  id_producto: string;
  cantidad_pedida: string | number;
  precio_unitario: string | number;
  cajas?: string | number | null;
  presentacion?: string | null;
  producto:
    | OrdenVentaLineaRow["producto"]
    | NonNullable<OrdenVentaLineaRow["producto"]>[]
    | null;
}

interface OrdenVentaDetalleDbRow extends OrdenVentaRow {
  comprador:
    | { nombre: string | null; codigo: string | null }
    | { nombre: string | null; codigo: string | null }[]
    | null;
  orden_venta_linea: OrdenVentaLineaDetalleDbRow[] | null;
  origen_texto?: string | null;
  origen_archivos?: string | null;
}

const WAREHOUSE_STOCK_VENTA_SELECT =
  "id_producto,id_bodega,id_ubicacion,cantidad,cantidad_reservada," +
  "producto:producto(id_producto,sku,descripcion,id_cliente,metadatos_catalogo)";

const UBICACION_VENTA_SELECT =
  "id_ubicacion,id_bodega,tipo_ubicacion(codigo,es_recepcion,es_almacenamiento,es_picking)";

interface CompradorDbRow {
  id_comprador: string;
  nombre: string;
}

interface BodegaDestinoDbRow {
  id_bodega: string;
  nombre: string;
}

interface OrdenVentaLineaDbRow {
  id_orden_venta: string;
  id_producto: string;
  cantidad_pedida: string | number;
  precio_unitario: string | number;
}

const ORDEN_VENTA_LINEA_COLUMNS =
  "id_orden_venta,id_producto,cantidad_pedida,precio_unitario";

interface OrdenVentaLineasResumen {
  count: number;
  cantidadKg: number;
  total: number;
}

interface WarehouseStockVentaRow {
  id_producto: string;
  id_bodega: string;
  id_ubicacion: string;
  cantidad: string | number;
  cantidad_reservada: string | number;
  producto: WarehouseStateRow["producto"];
}

interface StockVentaProductoAgg {
  kgDisponible: number;
  sampleRow: WarehouseStockVentaRow;
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
  if (!row) return null;
  return {
    id_producto: row.id_producto,
    sku: row.sku,
    descripcion: row.descripcion,
    id_cliente: row.id_cliente ?? null,
    metadatos_catalogo: row.metadatos_catalogo,
  };
}

async function resolveBodegaIdsForCuenta(
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

async function collectStockVentaPorProducto(
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

function mapStockRowToProductoOption(
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

function generateOrdenVentaCodigo(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `OV-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

async function resolveBodegaVenta(
  codigoCuenta: string,
  idBodega?: string | null,
): Promise<string> {
  const preferred = idBodega?.trim();
  if (preferred) {
    return preferred;
  }

  const ids = await resolveBodegaIdsForCuenta(codigoCuenta);
  const resolved = ids[0]?.trim();
  if (!resolved) {
    throw new DomainServiceError(
      "No hay bodega activa vinculada a la cuenta.",
      "INVALID_ARGUMENT",
    );
  }

  return resolved;
}

async function resolveClienteVenta(
  codigoCuenta: string,
  idProducto: string,
): Promise<string> {
  const productoRows = await runDomainQuery<
    { id_producto: string; id_cliente: string | null }[]
  >((client) => {
    const query = client
      .from("producto")
      .select("id_producto,id_cliente")
      .eq("codigo_cuenta", codigoCuenta)
      .eq("id_producto", idProducto)
      .limit(1);

    return query as unknown as Promise<{
      data: { id_producto: string; id_cliente: string | null }[] | null;
      error: { message: string } | null;
    }>;
  });

  const producto = productoRows[0];
  if (!producto) {
    throw new DomainServiceError(
      "El producto seleccionado no es válido.",
      "INVALID_ARGUMENT",
    );
  }

  if (producto.id_cliente?.trim()) {
    return producto.id_cliente.trim();
  }

  const clienteRows = await runDomainQuery<{ id_cliente: string }[]>(
    (client) => {
      const query = client
        .from("cliente")
        .select("id_cliente")
        .eq("codigo_cuenta", codigoCuenta)
        .eq("esta_activo", true)
        .order("nombre", { ascending: true })
        .limit(1);

      return query as unknown as Promise<{
        data: { id_cliente: string }[] | null;
        error: { message: string } | null;
      }>;
    },
  );

  const idCliente = clienteRows[0]?.id_cliente?.trim();
  if (!idCliente) {
    throw new DomainServiceError(
      "No hay cliente activo asociado al catálogo de la cuenta.",
      "INVALID_ARGUMENT",
    );
  }

  return idCliente;
}

async function assertCompradorDeCuenta(
  codigoCuenta: string,
  idComprador: string,
): Promise<void> {
  const rows = await runDomainQuery<{ id_comprador: string }[]>((client) => {
    const query = client
      .from("comprador")
      .select("id_comprador")
      .eq("codigo_cuenta", codigoCuenta)
      .eq("id_comprador", idComprador)
      .eq("esta_activo", true)
      .limit(1);

    return query as unknown as Promise<{
      data: { id_comprador: string }[] | null;
      error: { message: string } | null;
    }>;
  });

  if (!rows[0]) {
    throw new DomainServiceError(
      "El comprador seleccionado no es válido.",
      "INVALID_ARGUMENT",
    );
  }
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

async function fetchBodegaDestinoLabels(
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

function chunkIds(ids: string[], size: number): string[][] {
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += size) {
    chunks.push(ids.slice(i, i + size));
  }
  return chunks;
}

async function fetchLineasResumenByOrden(
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

async function fetchPreciosProductoMap(
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

async function fetchPreciosUnitariosProductos(
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

function mapOrdenVentaOperadorRow(
  row: OrdenVentaRow,
  compradorLabels: Map<string, string>,
  lineasResumen: Map<string, OrdenVentaLineasResumen>,
  bodegaDestinoLabels: Map<string, string>,
): OrdenVentaOperadorRow {
  const resumen = lineasResumen.get(row.id_orden_venta) ?? {
    count: 0,
    cantidadKg: 0,
    total: 0,
  };
  const destino = row.id_bodega_destino
    ? (bodegaDestinoLabels.get(row.id_bodega_destino) ?? "—")
    : "—";

  return {
    idOrdenVenta: row.id_orden_venta,
    venta: row.codigo,
    cuenta: row.codigo_cuenta,
    comprador: row.id_comprador
      ? (compradorLabels.get(row.id_comprador) ?? "—")
      : "—",
    productos: formatProductosResumen(resumen.count),
    cantidadKg: resumen.cantidadKg,
    total: resumen.total,
    estado: row.estado,
    fecha: row.created_at || row.fecha_pedido,
    destino,
    idBodega: row.id_bodega,
    idBodegaDestino: row.id_bodega_destino,
  };
}

// Confirmación y despacho operativo vía POST /ventas/ordenes/:id/emitir (API Nest).

export async function listOrdenesVenta(
  params: TenantListParams,
): Promise<OrdenVentaRow[]> {
  const limit = params.limit ?? DEFAULT_LIST_LIMIT;

  return runDomainQuery((client) => {
    const query = applyRecentOrdersFilter(
      applyTenantFilters(
        client.from("orden_venta").select(ORDEN_VENTA_COLUMNS),
        params,
      ),
      "fecha_pedido",
    )
      .order("fecha_pedido", { ascending: false })
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

  return enrichOrdenesVentaOperador(rows);
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

  const rows = await runDomainQuery<OrdenVentaRow[]>((client) => {
    const query = applyRecentOrdersFilter(
      client
        .from("orden_venta")
        .select(ORDEN_VENTA_COLUMNS)
        .eq("codigo_cuenta", codigoCuenta)
        .or(`id_bodega.eq.${idBodega},id_bodega_destino.eq.${idBodega}`),
      "fecha_pedido",
    )
      .order("fecha_pedido", { ascending: false })
      .limit(limit);

    return query as unknown as Promise<{
      data: OrdenVentaRow[] | null;
      error: { message: string } | null;
    }>;
  });

  return enrichOrdenesVentaOperador(rows);
}

async function enrichOrdenesVentaOperador(
  rows: OrdenVentaRow[],
): Promise<OrdenVentaOperadorRow[]> {
  const compradorIds = rows
    .map((row) => row.id_comprador)
    .filter((id): id is string => Boolean(id));
  const destinoIds = rows
    .map((row) => row.id_bodega_destino)
    .filter((id): id is string => Boolean(id));
  const ordenIds = rows.map((row) => row.id_orden_venta);

  const [compradorLabels, lineasResumen, bodegaDestinoLabels] = await Promise.all([
    fetchCompradorLabels(compradorIds),
    fetchLineasResumenByOrden(ordenIds),
    fetchBodegaDestinoLabels(destinoIds),
  ]);

  return rows.map((row) =>
    mapOrdenVentaOperadorRow(
      row,
      compradorLabels,
      lineasResumen,
      bodegaDestinoLabels,
    ),
  );
}

export interface ListProductosVentaCatalogoParams {
  codigoCuenta: string;
  idBodega?: string | null;
}

/** Bodega por defecto configurada en la cuenta (`cuenta.id_bodega_default`). */
export async function getCuentaIdBodegaDefault(
  codigoCuenta: string,
): Promise<string | null> {
  const cuenta = requireCodigoCuenta(codigoCuenta);
  const rows = await runDomainQuery<{ id_bodega_default: string | null }[]>(
    (client) => {
      const query = client
        .from("cuenta")
        .select("id_bodega_default")
        .eq("codigo_cuenta", cuenta)
        .limit(1);

      return query as unknown as Promise<{
        data: { id_bodega_default: string | null }[] | null;
        error: { message: string } | null;
      }>;
    },
  );

  return rows[0]?.id_bodega_default?.trim() || null;
}

export async function listProductosVentaCatalogo(
  params: ListProductosVentaCatalogoParams | string,
): Promise<ProductoVentaOption[]> {
  const { codigoCuenta } =
    typeof params === "string"
      ? { codigoCuenta: params }
      : params;
  const cuenta = requireCodigoCuenta(codigoCuenta);

  const [bodegaIds, productoRows, stockMap] = await Promise.all([
    resolveBodegaIdsForCuenta(cuenta),
    runDomainQuery<
      {
        id_producto: string;
        sku: string | null;
        descripcion: string | null;
        id_cliente: string | null;
        unidad_medida: string | null;
        metadatos_catalogo?: unknown;
      }[]
    >((client) => {
      const query = client
        .from("producto")
        .select(
          "id_producto,sku,descripcion,id_cliente,unidad_medida,metadatos_catalogo,esta_activo",
        )
        .eq("codigo_cuenta", cuenta)
        .eq("esta_activo", true)
        .order("descripcion", { ascending: true })
        .limit(1000);

      return query as unknown as Promise<{
        data:
          | {
              id_producto: string;
              sku: string | null;
              descripcion: string | null;
              id_cliente: string | null;
              unidad_medida: string | null;
              metadatos_catalogo?: unknown;
            }[]
          | null;
        error: { message: string } | null;
      }>;
    }),
    collectStockVentaPorProducto(cuenta),
  ]);

  const defaultBodegaId = bodegaIds[0] ?? "";
  if (!defaultBodegaId && stockMap.size === 0) {
    return [];
  }

  const precioMap = await fetchPreciosProductoMap(
    cuenta,
    productoRows.map((row) => row.id_producto),
  );

  return productoRows
    .map((row) => {
      const unidadMedida =
        row.unidad_medida?.trim() || UNIDAD_MEDIDA_VENTA_DEFAULT;
      const stock = stockMap.get(row.id_producto);
      if (stock) {
        return mapStockRowToProductoOption(
          row.id_producto,
          stock,
          precioMap.get(row.id_producto) ?? 0,
          unidadMedida,
        );
      }

      const codigo = row.sku?.trim() || row.id_producto.slice(0, 8);
      const nombre = resolveNombreProductoVenta(row, codigo);

      return {
        idProducto: row.id_producto,
        label: `${nombre} (${codigo})`,
        idCliente: row.id_cliente ?? null,
        idBodega: defaultBodegaId,
        codigo,
        nombre,
        kgDisponible: 0,
        precioUnitario: precioMap.get(row.id_producto) ?? 0,
        unidadMedida,
      } satisfies ProductoVentaOption;
    })
    .filter((row) => Boolean(row.idBodega))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

function ordenVentaCaptureFields(
  input: CreateOrdenVentaInput,
): Record<string, string | null> {
  const origenArchivos =
    input.origenArchivos && input.origenArchivos.length > 0
      ? input.origenArchivos.join(", ")
      : null;

  return {
    fecha_entrega: input.fechaEntrega?.trim() || null,
    ventana_desde: input.ventanaDesde?.trim() || null,
    ventana_hasta: input.ventanaHasta?.trim() || null,
    prioridad: input.prioridad?.trim() || null,
    orden_compra_hotel: input.ordenCompraHotel?.trim() || null,
    centro_consumo: input.centroConsumo?.trim() || null,
    vendedor: input.vendedor?.trim() || null,
    moneda: input.moneda?.trim() || null,
    bodega_destino_label: input.bodegaDestinoLabel?.trim() || null,
    direccion_entrega: input.direccionEntrega?.trim() || null,
    anden: input.anden?.trim() || null,
    contacto_entrega: input.contacto?.trim() || null,
    telefono_contacto: input.telefono?.trim() || null,
    turno: input.turno?.trim() || null,
    hora_salida: input.horaSalida?.trim() || null,
    chofer: input.chofer?.trim() || null,
    unidad: input.unidad?.trim() || null,
    acepta_sustituciones: input.aceptaSustituciones?.trim() || null,
    requiere_lote: input.requiereLote?.trim() || null,
    registrar_temperatura: input.registrarTemperatura?.trim() || null,
    origen_texto: input.origenTexto?.trim() || null,
    origen_archivos: origenArchivos,
    notas_lineas: input.notasLineas?.trim() || null,
    notas_almacen: input.notasAlmacen?.trim() || null,
  };
}

/** Crea una OV en borrador con una o más líneas (scope tenant, Supabase directo). */
export async function createOrdenVenta(
  input: CreateOrdenVentaInput & { idOrdenVenta?: string },
): Promise<OrdenVentaOperadorRow> {
  const codigoCuenta = requireCodigoCuenta(input.codigoCuenta);
  const idComprador = input.idComprador.trim();
  const idBodegaDestino = input.idBodegaDestino.trim();
  const observaciones = input.observaciones?.trim() || null;
  const idCreador = input.idCreador?.trim() || null;

  const lineas =
    input.lineas && input.lineas.length > 0
      ? input.lineas
      : input.idProducto?.trim()
        ? [
            {
              idProducto: input.idProducto.trim(),
              cantidadPedida: input.cantidadPedida ?? 1,
              idBodega: input.idBodega,
            },
          ]
        : [];

  if (!idComprador) {
    throw new DomainServiceError(
      "Selecciona un comprador.",
      "INVALID_ARGUMENT",
    );
  }

  if (!idBodegaDestino) {
    throw new DomainServiceError(
      "Selecciona una bodega destino.",
      "INVALID_ARGUMENT",
    );
  }

  if (lineas.length === 0) {
    throw new DomainServiceError(
      "Agrega al menos un producto a la venta.",
      "INVALID_ARGUMENT",
    );
  }

  for (const linea of lineas) {
    const idProducto = linea.idProducto.trim();
    const cantidadPedida = linea.cantidadPedida;

    if (!idProducto) {
      throw new DomainServiceError(
        "Cada línea debe tener un producto del catálogo.",
        "INVALID_ARGUMENT",
      );
    }

    if (!Number.isFinite(cantidadPedida) || cantidadPedida <= 0) {
      throw new DomainServiceError(
        "La cantidad de cada producto debe ser mayor a cero.",
        "INVALID_ARGUMENT",
      );
    }

    if (
      linea.precioUnitario != null &&
      (!Number.isFinite(linea.precioUnitario) || linea.precioUnitario < 0)
    ) {
      throw new DomainServiceError(
        "El precio de cada producto no puede ser negativo.",
        "INVALID_ARGUMENT",
      );
    }
  }

  await assertCompradorDeCuenta(codigoCuenta, idComprador);

  const primeraLinea = lineas[0]!;
  const productoIds = lineas.map((linea) => linea.idProducto.trim());
  const [idBodega, idCliente, preciosUnitarios] = await Promise.all([
    resolveBodegaVenta(
      codigoCuenta,
      input.idBodega ?? primeraLinea.idBodega,
    ),
    resolveClienteVenta(codigoCuenta, primeraLinea.idProducto.trim()),
    fetchPreciosUnitariosProductos(codigoCuenta, productoIds),
  ]);

  for (const idProducto of productoIds) {
    if (!preciosUnitarios.has(idProducto)) {
      throw new DomainServiceError(
        "Uno de los productos seleccionados no es válido.",
        "INVALID_ARGUMENT",
      );
    }
  }

  const capture = ordenVentaCaptureFields(input);
  const idOrdenVentaExistente =
    "idOrdenVenta" in input && typeof input.idOrdenVenta === "string"
      ? input.idOrdenVenta.trim()
      : "";

  if (idOrdenVentaExistente) {
    if (!input.origenTexto?.trim()) {
      delete capture.origen_texto;
    }
    if (!input.origenArchivos || input.origenArchivos.length === 0) {
      delete capture.origen_archivos;
    }
  }

  let orden: OrdenVentaRow;

  if (idOrdenVentaExistente) {
    const existing = await runDomainQuery<{ estado: string } | null>(
      (client) => {
        const query = client
          .from("orden_venta")
          .select("estado")
          .eq("codigo_cuenta", codigoCuenta)
          .eq("id_orden_venta", idOrdenVentaExistente)
          .maybeSingle();

        return query as unknown as Promise<{
          data: { estado: string } | null;
          error: { message: string } | null;
        }>;
      },
    );

    if (!existing) {
      throw new DomainServiceError(
        "No se encontró la orden de venta.",
        "NOT_FOUND",
      );
    }

    if (!puedeEditarOrdenVenta(existing.estado)) {
      throw new DomainServiceError(
        "Esta orden ya no se puede editar.",
        "MUTATION_FAILED",
      );
    }

    orden = await runDomainMutation<OrdenVentaRow>((client) => {
      const query = client
        .from("orden_venta")
        .update({
          id_bodega: idBodega,
          id_cliente: idCliente,
          id_comprador: idComprador,
          id_bodega_destino: idBodegaDestino,
          ...capture,
          observaciones,
        })
        .eq("codigo_cuenta", codigoCuenta)
        .eq("id_orden_venta", idOrdenVentaExistente)
        .select(ORDEN_VENTA_COLUMNS)
        .single();

      return query as unknown as Promise<{
        data: OrdenVentaRow | null;
        error: { message: string } | null;
      }>;
    });

    await runDomainMutation((client) => {
      const query = client
        .from("orden_venta_linea")
        .delete()
        .eq("id_orden_venta", orden.id_orden_venta);

      return query as unknown as Promise<{
        data: unknown;
        error: { message: string } | null;
      }>;
    });
  } else {
    orden = await runDomainMutation<OrdenVentaRow>((client) => {
      const query = client
        .from("orden_venta")
        .insert({
          codigo_cuenta: codigoCuenta,
          id_bodega: idBodega,
          id_cliente: idCliente,
          id_comprador: idComprador,
          id_creador: idCreador,
          id_bodega_destino: idBodegaDestino,
          ...capture,
          codigo: generateOrdenVentaCodigo(),
          estado: "borrador",
          observaciones,
        })
        .select(ORDEN_VENTA_COLUMNS)
        .single();

      return query as unknown as Promise<{
        data: OrdenVentaRow | null;
        error: { message: string } | null;
      }>;
    });
  }

  await runDomainMutation((client) => {
    const query = client.from("orden_venta_linea").insert(
      lineas.map((linea) => {
        const idProducto = linea.idProducto.trim();
        const catalogPrecio = preciosUnitarios.get(idProducto) ?? 0;
        const precioUnitario =
          linea.precioUnitario != null && Number.isFinite(linea.precioUnitario)
            ? linea.precioUnitario
            : catalogPrecio;

        return {
          id_orden_venta: orden.id_orden_venta,
          id_producto: idProducto,
          cantidad_pedida: linea.cantidadPedida,
          precio_unitario: precioUnitario,
          cajas: linea.cajas ?? null,
          presentacion: linea.presentacion?.trim() || null,
        };
      }),
    );

    return query as unknown as Promise<{
      data: unknown;
      error: { message: string } | null;
    }>;
  });

  const compradorLabels = await fetchCompradorLabels([idComprador]);
  const lineasResumen = new Map<string, OrdenVentaLineasResumen>([
    [
      orden.id_orden_venta,
      lineas.reduce(
        (acc, linea) => {
          const precioUnitario =
            linea.precioUnitario != null && Number.isFinite(linea.precioUnitario)
              ? linea.precioUnitario
              : (preciosUnitarios.get(linea.idProducto.trim()) ?? 0);
          return {
            count: acc.count + 1,
            cantidadKg: acc.cantidadKg + linea.cantidadPedida,
            total: acc.total + linea.cantidadPedida * precioUnitario,
          };
        },
        { count: 0, cantidadKg: 0, total: 0 },
      ),
    ],
  ]);

  return mapOrdenVentaOperadorRow(
    orden,
    compradorLabels,
    lineasResumen,
    new Map(),
  );
}

/** Actualiza cabecera y líneas de una OV editable (no despachada/cerrada/cancelada). */
export async function updateOrdenVenta(
  input: UpdateOrdenVentaInput,
): Promise<OrdenVentaOperadorRow> {
  const idOrdenVenta = input.idOrdenVenta.trim();
  if (!idOrdenVenta) {
    throw new DomainServiceError(
      "La orden de venta no es válida.",
      "INVALID_ARGUMENT",
    );
  }

  return createOrdenVenta({ ...input, idOrdenVenta });
}

function resolveCompradorRel(
  comprador: OrdenVentaDetalleDbRow["comprador"],
): { nombre: string | null; codigo: string | null } | null {
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
    producto: resolveOrdenVentaLineaProducto(row.producto),
  };
}

function mapOrdenVentaDetalleRow(
  row: OrdenVentaDetalleDbRow,
  bodegaLabels: Map<string, string>,
): OrdenVentaDetalleRow {
  const { comprador, orden_venta_linea, ...orden } = row;
  const compradorRel = resolveCompradorRel(comprador);

  return {
    ...orden,
    comprador_nombre: compradorRel?.nombre?.trim() || null,
    comprador_codigo: compradorRel?.codigo?.trim() || null,
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
