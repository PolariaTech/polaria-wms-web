import {
  applyTenantFilters,
  DEFAULT_LIST_LIMIT,
  requireCodigoCuenta,
  runDomainMutation,
  type TenantListParams,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { resolveProductoNombre } from "@/modules/warehouses/estado-bodega/utils/estado-bodega-slot-content";
import { listAlmacenamientoVentaUbicacionIds } from "@/modules/warehouses/estado-bodega/utils/estado-bodega-zone-ubicaciones";
import type { UbicacionEstadoBodegaDbRow } from "@/modules/warehouses/estado-bodega/types/estado-bodega.types";
import type { WarehouseStateRow } from "@/modules/inventory/shared/types/inventory.types";
import { resolvePrecioUnitarioFromMetadatos } from "../utils/sales-precio";
import type {
  CreateOrdenVentaInput,
  OrdenVentaDetalleRow,
  OrdenVentaLineaRow,
  OrdenVentaOperadorRow,
  OrdenVentaRow,
  ProductoVentaOption,
} from "../types/sales.types";

const ORDEN_VENTA_COLUMNS =
  "id_orden_venta,codigo_cuenta,id_bodega,id_cliente,id_comprador,id_planta,id_creador,id_bodega_destino,codigo,estado,fecha_pedido,observaciones,created_at,updated_at";

const COMPRADOR_COLUMNS = "id_comprador,nombre";

const ORDEN_VENTA_DETALLE_SELECT =
  `${ORDEN_VENTA_COLUMNS},` +
  "comprador:comprador(nombre,codigo)," +
  "orden_venta_linea(id_linea_orden_venta,id_producto,cantidad_pedida,precio_unitario,producto(sku,descripcion,metadatos_catalogo))";

interface OrdenVentaLineaDetalleDbRow {
  id_linea_orden_venta: string;
  id_producto: string;
  cantidad_pedida: string | number;
  precio_unitario: string | number;
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
  return row ?? null;
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

async function resolveBodegaVentaForCuenta(
  codigoCuenta: string,
): Promise<string> {
  return resolveBodegaVenta(codigoCuenta);
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

async function resolveKgDisponibleProducto(
  codigoCuenta: string,
  idProducto: string,
): Promise<number> {
  const stockMap = await collectStockVentaPorProducto(codigoCuenta);
  return stockMap.get(idProducto)?.kgDisponible ?? 0;
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

async function fetchLineasResumenByOrden(
  ids: string[],
): Promise<Map<string, OrdenVentaLineasResumen>> {
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

async function fetchPreciosUnitariosProductos(
  codigoCuenta: string,
  idProductos: string[],
): Promise<Map<string, number>> {
  const uniqueIds = [...new Set(idProductos.map((id) => id.trim()).filter(Boolean))];
  if (uniqueIds.length === 0) return new Map();

  const rows = await runDomainQuery<
    { id_producto: string; metadatos_catalogo: unknown }[]
  >((client) => {
    const query = client
      .from("producto")
      .select("id_producto,metadatos_catalogo")
      .eq("codigo_cuenta", codigoCuenta)
      .in("id_producto", uniqueIds)
      .limit(uniqueIds.length);

    return query as unknown as Promise<{
      data: { id_producto: string; metadatos_catalogo: unknown }[] | null;
      error: { message: string } | null;
    }>;
  });

  return new Map(
    rows.map((row) => [
      row.id_producto,
      resolvePrecioUnitarioFromMetadatos(row.metadatos_catalogo),
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
    fecha: row.fecha_pedido || row.created_at,
    destino,
  };
}

// Confirmación y despacho operativo vía POST /ventas/ordenes/:id/emitir (API Nest).

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

export async function listProductosVentaCatalogo(
  params: ListProductosVentaCatalogoParams | string,
): Promise<ProductoVentaOption[]> {
  const { codigoCuenta } =
    typeof params === "string"
      ? { codigoCuenta: params }
      : params;
  const cuenta = requireCodigoCuenta(codigoCuenta);
  const stockMap = await collectStockVentaPorProducto(cuenta);

  return [...stockMap.entries()]
    .map(([idProducto, stock]) => mapStockRowToProductoOption(idProducto, stock))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

/** Crea una OV en borrador con una o más líneas (scope tenant, Supabase directo). */
export async function createOrdenVenta(
  input: CreateOrdenVentaInput,
): Promise<OrdenVentaOperadorRow> {
  const codigoCuenta = requireCodigoCuenta(input.codigoCuenta);
  const idComprador = input.idComprador.trim();
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
  }

  await assertCompradorDeCuenta(codigoCuenta, idComprador);

  const cantidadPorProducto = new Map<string, number>();
  for (const linea of lineas) {
    const id = linea.idProducto.trim();
    cantidadPorProducto.set(
      id,
      (cantidadPorProducto.get(id) ?? 0) + linea.cantidadPedida,
    );
  }

  for (const [idProducto, cantidadTotal] of cantidadPorProducto) {
    const kgDisponible = await resolveKgDisponibleProducto(
      codigoCuenta,
      idProducto,
    );
    if (cantidadTotal > kgDisponible) {
      throw new DomainServiceError(
        `No puedes vender más de ${kgDisponible.toLocaleString("es-CL", { maximumFractionDigits: 4 })} kg. Disponible en stock: ${kgDisponible.toLocaleString("es-CL", { maximumFractionDigits: 4 })} kg.`,
        "INVALID_ARGUMENT",
      );
    }
  }

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

  const orden = await runDomainMutation<OrdenVentaRow>((client) => {
    const query = client
      .from("orden_venta")
      .insert({
        codigo_cuenta: codigoCuenta,
        id_bodega: idBodega,
        id_cliente: idCliente,
        id_comprador: idComprador,
        id_creador: idCreador,
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

  await runDomainMutation((client) => {
    const query = client.from("orden_venta_linea").insert(
      lineas.map((linea) => {
        const idProducto = linea.idProducto.trim();
        const precioUnitario = preciosUnitarios.get(idProducto) ?? 0;

        return {
          id_orden_venta: orden.id_orden_venta,
          id_producto: idProducto,
          cantidad_pedida: linea.cantidadPedida,
          precio_unitario: precioUnitario,
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
            preciosUnitarios.get(linea.idProducto.trim()) ?? 0;
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
