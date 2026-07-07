import {
  applyTenantFilters,
  DEFAULT_LIST_LIMIT,
  type TenantListParams,
  runDomainQuery,
  runDomainMutation,
} from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { decodeProveedorRazonSocial } from "@/modules/admin-panel";
import type {
  DestinoTipoOrden,
  OrdenCompraLineaRow,
  OrdenCompraRow,
  RecepcionCompraRow,
  SolicitudCompraLineaRow,
  SolicitudCompraRow,
} from "../../shared/types/purchases.types";

const SOLICITUD_COLUMNS =
  "id_solicitud_compra,codigo_cuenta,id_bodega,id_proveedor,id_orden_compra,codigo,estado,id_solicitante,observaciones,created_at,updated_at," +
  "solicitud_compra_linea(id_linea_solicitud_compra,id_producto,cantidad,producto(sku,descripcion,codigo_almacen))";

const ORDEN_COLUMNS =
  "id_orden_compra,codigo_cuenta,id_bodega,id_proveedor,id_solicitud_compra,id_creador,codigo,estado,fecha_emision,fecha_entrega_estimada,destino_tipo,observaciones,created_at,updated_at," +
  "proveedor(razon_social)," +
  "orden_compra_linea(id_linea_orden_compra,id_producto,cantidad,cantidad_recibida,producto(sku,descripcion,metadatos_catalogo))";

const RECEPCION_COLUMNS =
  "id_recepcion,codigo_cuenta,id_bodega,id_orden_compra,sin_diferencias,notas,cerrada_at,cerrada_por,created_at";

const ORDEN_LINEA_COLUMNS = "cantidad,producto(sku,unidad_medida)";

export interface OrdenCompraNotifyLineaRow {
  sku: string;
  cantidad: number;
  unidad: string;
}

interface OrdenCompraLineaListDbRow {
  id_linea_orden_compra: string;
  id_producto: string;
  cantidad: string | number;
  cantidad_recibida?: string | number | null;
  producto:
    | {
        sku: string | null;
        descripcion: string | null;
        metadatos_catalogo?: unknown;
      }
    | {
        sku: string | null;
        descripcion: string | null;
        metadatos_catalogo?: unknown;
      }[]
    | null;
}

interface OrdenCompraDbRow extends Omit<OrdenCompraRow, "lineas" | "proveedor_nombre"> {
  proveedor:
    | { razon_social: string | null }
    | { razon_social: string | null }[]
    | null;
  orden_compra_linea: OrdenCompraLineaListDbRow[] | null;
}

interface OrdenCompraLineaNotifyDbRow {
  cantidad: string | number;
  producto:
    | { sku: string; unidad_medida: string | null }
    | { sku: string; unidad_medida: string | null }[]
    | null;
}

function resolveProducto(
  producto: OrdenCompraLineaNotifyDbRow["producto"],
): { sku: string; unidad_medida: string | null } | null {
  if (!producto) return null;
  return Array.isArray(producto) ? (producto[0] ?? null) : producto;
}

function resolveProveedorNombre(
  proveedor: OrdenCompraDbRow["proveedor"],
): string | null {
  const row = Array.isArray(proveedor) ? (proveedor[0] ?? null) : proveedor;
  const razonSocial = row?.razon_social?.trim();
  if (!razonSocial) {
    return null;
  }

  const { proveedor: nombre, nombre: contacto } =
    decodeProveedorRazonSocial(razonSocial);

  if (contacto && contacto !== nombre) {
    return `${nombre} — ${contacto}`;
  }

  return nombre || contacto || razonSocial;
}

function resolveOrdenLineaProducto(
  producto: OrdenCompraLineaListDbRow["producto"],
): OrdenCompraLineaRow["producto"] {
  if (!producto) {
    return null;
  }

  return Array.isArray(producto) ? (producto[0] ?? null) : producto;
}

function mapOrdenCompraLineaListRow(
  row: OrdenCompraLineaListDbRow,
): OrdenCompraLineaRow {
  return {
    id_linea_orden_compra: row.id_linea_orden_compra,
    id_producto: row.id_producto,
    cantidad: Number(row.cantidad),
    cantidad_recibida:
      row.cantidad_recibida != null ? Number(row.cantidad_recibida) : 0,
    producto: resolveOrdenLineaProducto(row.producto),
  };
}

function mapOrdenCompraRow(row: OrdenCompraDbRow): OrdenCompraRow {
  const { proveedor, orden_compra_linea, ...orden } = row;

  return {
    ...orden,
    proveedor_nombre: resolveProveedorNombre(proveedor),
    lineas: (orden_compra_linea ?? []).map(mapOrdenCompraLineaListRow),
  };
}

function mapOrdenCompraLineaNotifyRow(
  row: OrdenCompraLineaNotifyDbRow,
): OrdenCompraNotifyLineaRow | null {
  const producto = resolveProducto(row.producto);
  const sku = producto?.sku?.trim() ?? "";
  const cantidad = Number(row.cantidad);
  const unidad = producto?.unidad_medida?.trim() || "und";

  if (!sku || !Number.isFinite(cantidad) || cantidad <= 0) {
    return null;
  }

  return { sku, cantidad, unidad };
}

interface SolicitudCompraLineaDbRow {
  id_linea_solicitud_compra: string;
  id_producto: string;
  cantidad: string | number;
  producto:
    | {
        sku: string | null;
        descripcion: string | null;
        codigo_almacen: string | null;
      }
    | {
        sku: string | null;
        descripcion: string | null;
        codigo_almacen: string | null;
      }[]
    | null;
}

interface SolicitudCompraDbRow extends Omit<SolicitudCompraRow, "lineas"> {
  solicitud_compra_linea: SolicitudCompraLineaDbRow[] | null;
}

function resolveLineaProducto(
  producto: SolicitudCompraLineaDbRow["producto"],
): SolicitudCompraLineaRow["producto"] {
  if (!producto) {
    return null;
  }

  return Array.isArray(producto) ? (producto[0] ?? null) : producto;
}

function mapSolicitudCompraLineaRow(
  row: SolicitudCompraLineaDbRow,
): SolicitudCompraLineaRow {
  return {
    id_linea_solicitud_compra: row.id_linea_solicitud_compra,
    id_producto: row.id_producto,
    cantidad: Number(row.cantidad),
    producto: resolveLineaProducto(row.producto),
  };
}

function mapSolicitudCompraRow(row: SolicitudCompraDbRow): SolicitudCompraRow {
  const { solicitud_compra_linea, ...solicitud } = row;

  return {
    ...solicitud,
    lineas: (solicitud_compra_linea ?? []).map(mapSolicitudCompraLineaRow),
  };
}

// TODO POL-5+: crear/aprobar solicitudes y órdenes vía apiRequest al API Nest.

export async function listSolicitudesCompra(
  params: TenantListParams,
): Promise<SolicitudCompraRow[]> {
  const limit = params.limit ?? DEFAULT_LIST_LIMIT;

  return runDomainQuery((client) => {
    const query = applyTenantFilters(
      client.from("solicitud_compra").select(SOLICITUD_COLUMNS),
      params,
    )
      .order("created_at", { ascending: false })
      .limit(limit);

    return query as unknown as Promise<{
      data: SolicitudCompraDbRow[] | null;
      error: { message: string } | null;
    }>;
  }).then((rows) => rows.map(mapSolicitudCompraRow));
}

export async function listOrdenesCompra(
  params: TenantListParams,
): Promise<OrdenCompraRow[]> {
  const limit = params.limit ?? DEFAULT_LIST_LIMIT;

  return runDomainQuery((client) => {
    const query = applyTenantFilters(
      client.from("orden_compra").select(ORDEN_COLUMNS),
      params,
    )
      .order("created_at", { ascending: false })
      .limit(limit);

    return query as unknown as Promise<{
      data: OrdenCompraDbRow[] | null;
      error: { message: string } | null;
    }>;
  }).then((rows) => rows.map(mapOrdenCompraRow));
}

/** Líneas de una orden de compra para notificación al proveedor (lectura Supabase). */
export async function listOrdenCompraLineas(
  idOrdenCompra: string,
): Promise<OrdenCompraNotifyLineaRow[]> {
  const ordenId = idOrdenCompra.trim();

  if (!ordenId) {
    throw new DomainServiceError(
      "La orden de compra no es válida.",
      "INVALID_ARGUMENT",
    );
  }

  const rows = await runDomainQuery<OrdenCompraLineaNotifyDbRow[]>((client) => {
    const query = client
      .from("orden_compra_linea")
      .select(ORDEN_LINEA_COLUMNS)
      .eq("id_orden_compra", ordenId);

    return query as unknown as Promise<{
      data: OrdenCompraLineaNotifyDbRow[] | null;
      error: { message: string } | null;
    }>;
  });

  const lineas = rows
    .map(mapOrdenCompraLineaNotifyRow)
    .filter((linea): linea is OrdenCompraNotifyLineaRow => linea !== null);

  if (!lineas.length) {
    throw new DomainServiceError(
      "La orden no tiene líneas válidas para notificar.",
      "INVALID_ARGUMENT",
    );
  }

  return lineas;
}

export async function updateOrdenCompraDestino(
  idOrdenCompra: string,
  codigoCuenta: string,
  patch: {
    destinoTipo?: DestinoTipoOrden;
    fechaEntregaEstimada?: string | null;
  },
): Promise<void> {
  const ordenId = idOrdenCompra.trim();
  const cuenta = codigoCuenta.trim();

  if (!ordenId) {
    throw new DomainServiceError(
      "La orden de compra no es válida.",
      "INVALID_ARGUMENT",
    );
  }

  if (!cuenta) {
    throw new DomainServiceError(
      "No se encontró la cuenta activa.",
      "INVALID_ARGUMENT",
    );
  }

  const body: {
    destino_tipo?: DestinoTipoOrden;
    fecha_entrega_estimada?: string | null;
  } = {};

  if (patch.destinoTipo !== undefined) {
    body.destino_tipo = patch.destinoTipo;
  }

  if (patch.fechaEntregaEstimada !== undefined) {
    body.fecha_entrega_estimada =
      patch.fechaEntregaEstimada === null || patch.fechaEntregaEstimada === ""
        ? null
        : patch.fechaEntregaEstimada.includes("T")
          ? patch.fechaEntregaEstimada
          : `${patch.fechaEntregaEstimada}T12:00:00.000Z`;
  }

  if (!Object.keys(body).length) {
    return;
  }

  await runDomainMutation((client) =>
    client
      .from("orden_compra")
      .update(body)
      .eq("id_orden_compra", ordenId)
      .eq("codigo_cuenta", cuenta)
      .select("id_orden_compra")
      .single() as unknown as Promise<{
      data: { id_orden_compra: string } | null;
      error: { message: string } | null;
    }>,
  );
}

export async function listRecepciones(
  params: TenantListParams,
): Promise<RecepcionCompraRow[]> {
  const limit = params.limit ?? DEFAULT_LIST_LIMIT;

  return runDomainQuery((client) => {
    const query = applyTenantFilters(
      client.from("recepcion_compra").select(RECEPCION_COLUMNS),
      params,
    )
      .order("created_at", { ascending: false })
      .limit(limit);

    return query as unknown as Promise<{
      data: RecepcionCompraRow[] | null;
      error: { message: string } | null;
    }>;
  });
}
