import {
  applyTenantFilters,
  DEFAULT_LIST_LIMIT,
  requireCodigoCuenta,
  runDomainMutation,
  type TenantListParams,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/domain-service-error";
import type {
  CreateOrdenVentaInput,
  OrdenVentaOperadorRow,
  OrdenVentaRow,
  ProductoVentaOption,
} from "../types/sales.types";

const ORDEN_VENTA_COLUMNS =
  "id_orden_venta,codigo_cuenta,id_bodega,id_cliente,id_comprador,id_planta,id_creador,id_bodega_destino,codigo,estado,fecha_pedido,observaciones,created_at,updated_at";

const COMPRADOR_COLUMNS = "id_comprador,nombre";

const ORDEN_VENTA_LINEA_COLUMNS = "id_orden_venta,id_producto";

const PRODUCTO_VENTA_COLUMNS = "id_producto,descripcion,sku,id_cliente";

interface CompradorDbRow {
  id_comprador: string;
  nombre: string;
}

interface OrdenVentaLineaDbRow {
  id_orden_venta: string;
  id_producto: string;
}

interface ProductoVentaDbRow {
  id_producto: string;
  descripcion: string;
  sku: string;
  id_cliente: string | null;
}

function resolveProductoLabel(row: ProductoVentaDbRow): string {
  const titulo = row.descripcion.trim();
  return titulo ? `${titulo} (${row.sku})` : row.sku;
}

function generateOrdenVentaCodigo(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `OV-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

async function resolveBodegaVentaForCuenta(
  codigoCuenta: string,
): Promise<string> {
  const rows = await runDomainQuery<{ id_bodega: string }[]>((client) => {
    const query = client
      .from("bodega")
      .select("id_bodega")
      .eq("codigo_cuenta", codigoCuenta)
      .eq("tipo", "interna")
      .eq("esta_activa", true)
      .order("nombre", { ascending: true })
      .limit(1);

    return query as unknown as Promise<{
      data: { id_bodega: string }[] | null;
      error: { message: string } | null;
    }>;
  });

  const idBodega = rows[0]?.id_bodega?.trim();
  if (!idBodega) {
    throw new DomainServiceError(
      "No hay bodega interna activa vinculada a la cuenta.",
      "INVALID_ARGUMENT",
    );
  }

  return idBodega;
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
      .eq("esta_activo", true)
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

async function fetchLineasCountByOrden(
  ids: string[],
): Promise<Map<string, number>> {
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

  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.id_orden_venta, (counts.get(row.id_orden_venta) ?? 0) + 1);
  }

  return counts;
}

function mapOrdenVentaOperadorRow(
  row: OrdenVentaRow,
  compradorLabels: Map<string, string>,
  lineasCount: Map<string, number>,
): OrdenVentaOperadorRow {
  const productosCount = lineasCount.get(row.id_orden_venta) ?? 0;

  return {
    idOrdenVenta: row.id_orden_venta,
    venta: row.codigo,
    comprador: row.id_comprador
      ? (compradorLabels.get(row.id_comprador) ?? "—")
      : "—",
    productos: formatProductosResumen(productosCount),
    estado: row.estado,
    fecha: row.fecha_pedido || row.created_at,
  };
}

// TODO POL-5+: confirmar y despachar OV vía apiRequest al API Nest.

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
  const ordenIds = rows.map((row) => row.id_orden_venta);

  const [compradorLabels, lineasCount] = await Promise.all([
    fetchCompradorLabels(compradorIds),
    fetchLineasCountByOrden(ordenIds),
  ]);

  return rows.map((row) =>
    mapOrdenVentaOperadorRow(row, compradorLabels, lineasCount),
  );
}

export async function listProductosVentaCatalogo(
  codigoCuenta: string,
): Promise<ProductoVentaOption[]> {
  const cuenta = requireCodigoCuenta(codigoCuenta);

  const rows = await runDomainQuery<ProductoVentaDbRow[]>((client) => {
    const query = client
      .from("producto")
      .select(PRODUCTO_VENTA_COLUMNS)
      .eq("codigo_cuenta", cuenta)
      .eq("esta_activo", true)
      .order("descripcion", { ascending: true })
      .limit(DEFAULT_LIST_LIMIT);

    return query as unknown as Promise<{
      data: ProductoVentaDbRow[] | null;
      error: { message: string } | null;
    }>;
  });

  return rows.map((row) => ({
    idProducto: row.id_producto,
    label: resolveProductoLabel(row),
    idCliente: row.id_cliente,
  }));
}

/** Crea una OV en borrador con una línea mínima (scope tenant, Supabase directo). */
export async function createOrdenVenta(
  input: CreateOrdenVentaInput,
): Promise<OrdenVentaOperadorRow> {
  const codigoCuenta = requireCodigoCuenta(input.codigoCuenta);
  const idComprador = input.idComprador.trim();
  const idProducto = input.idProducto.trim();
  const cantidadPedida = input.cantidadPedida ?? 1;
  const observaciones = input.observaciones?.trim() || null;
  const idCreador = input.idCreador?.trim() || null;

  if (!idComprador) {
    throw new DomainServiceError(
      "Selecciona un comprador.",
      "INVALID_ARGUMENT",
    );
  }

  if (!idProducto) {
    throw new DomainServiceError(
      "Selecciona un producto del catálogo.",
      "INVALID_ARGUMENT",
    );
  }

  if (!Number.isFinite(cantidadPedida) || cantidadPedida <= 0) {
    throw new DomainServiceError(
      "La cantidad debe ser mayor a cero.",
      "INVALID_ARGUMENT",
    );
  }

  await assertCompradorDeCuenta(codigoCuenta, idComprador);

  const [idBodega, idCliente] = await Promise.all([
    resolveBodegaVentaForCuenta(codigoCuenta),
    resolveClienteVenta(codigoCuenta, idProducto),
  ]);

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
    const query = client.from("orden_venta_linea").insert({
      id_orden_venta: orden.id_orden_venta,
      id_producto: idProducto,
      cantidad_pedida: cantidadPedida,
    });

    return query as unknown as Promise<{
      data: unknown;
      error: { message: string } | null;
    }>;
  });

  const compradorLabels = await fetchCompradorLabels([idComprador]);

  return mapOrdenVentaOperadorRow(
    orden,
    compradorLabels,
    new Map([[orden.id_orden_venta, 1]]),
  );
}
