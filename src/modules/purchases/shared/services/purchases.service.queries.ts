import {
  applyTenantFilters,
  applyRecentOrdersFilter,
  DEFAULT_LIST_LIMIT,
  type TenantListParams,
  runDomainQuery,
  runDomainMutation,
} from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import type {
  DestinoTipoOrden,
  OrdenCompraLineaRow,
  OrdenCompraRow,
  RecepcionCompraRow,
  SolicitudCompraRow,
} from "../../shared/types/purchases.types";
import {
  mapOrdenCompraLineaListRow,
  mapOrdenCompraLineaNotifyRow,
  mapOrdenCompraRow,
  mapSolicitudCompraRow,
  ORDEN_COLUMNS,
  ORDEN_LINEA_COLUMNS,
  ORDEN_LINEA_RECEPCION_COLUMNS,
  RECEPCION_COLUMNS,
  SOLICITUD_COLUMNS,
  type OrdenCompraDbRow,
  type OrdenCompraLineaListDbRow,
  type OrdenCompraLineaNotifyDbRow,
  type OrdenCompraNotifyLineaRow,
  type SolicitudCompraDbRow,
} from "./purchases.service.mappers";

// TODO POL-5+: crear/aprobar solicitudes y órdenes vía apiRequest al API Nest.

export type { OrdenCompraNotifyLineaRow } from "./purchases.service.mappers";

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
    const query = applyRecentOrdersFilter(
      applyTenantFilters(
        client.from("orden_compra").select(ORDEN_COLUMNS),
        params,
      ),
      "fecha_emision",
    )
      .order("fecha_emision", { ascending: false })
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
      .eq("id_orden_compra", ordenId)
      .limit(500);

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

/** Líneas completas de una orden de compra para recepción física (custodio / ingreso). */
export async function listOrdenCompraLineasRecepcion(
  idOrdenCompra: string,
): Promise<OrdenCompraLineaRow[]> {
  const ordenId = idOrdenCompra.trim();

  if (!ordenId) {
    throw new DomainServiceError(
      "La orden de compra no es válida.",
      "INVALID_ARGUMENT",
    );
  }

  const rows = await runDomainQuery<OrdenCompraLineaListDbRow[]>((client) => {
    const query = client
      .from("orden_compra_linea")
      .select(ORDEN_LINEA_RECEPCION_COLUMNS)
      .eq("id_orden_compra", ordenId)
      .limit(500);

    return query as unknown as Promise<{
      data: OrdenCompraLineaListDbRow[] | null;
      error: { message: string } | null;
    }>;
  });

  return rows.map(mapOrdenCompraLineaListRow);
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