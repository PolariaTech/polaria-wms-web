import {
  DEFAULT_LIST_LIMIT,
  requireCodigoCuenta,
  runDomainQuery,
  type TenantListParams,
} from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/domain-service-error";
import { apiRequest } from "@/services/api";
import type { TipoIntegracion } from "../constants/integration-types";
import type {
  CreateSolicitudIntegracionInput,
  SolicitudIntegracionRow,
} from "../types/integration.types";

const SOLICITUD_INTEGRACION_COLUMNS =
  "id_solicitud_integracion,codigo_cuenta,id_cliente,bodega_externa_id,bodega_externa_nombre,scraping,api,csv_plano,estado,created_at,id_solicitante";

export const SOLICITUD_INTEGRACION_SELECT_COLUMNS = SOLICITUD_INTEGRACION_COLUMNS;

export interface SolicitudIntegracionDbRow {
  id_solicitud_integracion: string;
  codigo_cuenta: string;
  id_cliente: string;
  bodega_externa_id: string;
  bodega_externa_nombre: string;
  scraping: boolean;
  api: boolean;
  csv_plano: boolean;
  estado: string;
  created_at: string;
  id_solicitante: string;
}

function resolveTipoIntegracion(row: Pick<
  SolicitudIntegracionDbRow,
  "scraping" | "api" | "csv_plano"
>): TipoIntegracion | null {
  if (row.scraping) return "scraping";
  if (row.api) return "api";
  if (row.csv_plano) return "csv_plano";
  return null;
}

export function mapSolicitudIntegracionRow(
  row: SolicitudIntegracionDbRow,
): SolicitudIntegracionRow {
  return {
    idSolicitudIntegracion: row.id_solicitud_integracion,
    bodegaExternaId: row.bodega_externa_id,
    bodegaNombre: row.bodega_externa_nombre?.trim() || "—",
    tipoIntegracion: resolveTipoIntegracion(row),
    estado: row.estado,
    createdAt: row.created_at,
  };
}

function mapApiSolicitudIntegracionRow(row: {
  idSolicitudIntegracion: string;
  bodegaExternaId: string;
  bodegaNombre: string;
  tipoIntegracion: TipoIntegracion | null;
  estado: string;
  createdAt: string;
}): SolicitudIntegracionRow {
  return {
    idSolicitudIntegracion: row.idSolicitudIntegracion,
    bodegaExternaId: row.bodegaExternaId,
    bodegaNombre: row.bodegaNombre,
    tipoIntegracion: row.tipoIntegracion,
    estado: row.estado,
    createdAt: row.createdAt,
  };
}

export async function listSolicitudesIntegracion(
  params: TenantListParams,
): Promise<SolicitudIntegracionRow[]> {
  const codigoCuenta = requireCodigoCuenta(params.codigoCuenta);

  try {
    const rows = await apiRequest<
      {
        idSolicitudIntegracion: string;
        bodegaExternaId: string;
        bodegaNombre: string;
        tipoIntegracion: TipoIntegracion | null;
        estado: string;
        createdAt: string;
      }[]
    >("/integracion/solicitudes", {
      method: "GET",
      auth: true,
    });

    return rows.map(mapApiSolicitudIntegracionRow);
  } catch {
    const limit = params.limit ?? DEFAULT_LIST_LIMIT;

    const rows = await runDomainQuery<SolicitudIntegracionDbRow[]>((client) => {
      const query = client
        .from("solicitud_integracion")
        .select(SOLICITUD_INTEGRACION_COLUMNS)
        .eq("codigo_cuenta", codigoCuenta)
        .order("created_at", { ascending: false })
        .limit(limit);

      return query as unknown as Promise<{
        data: SolicitudIntegracionDbRow[] | null;
        error: { message: string } | null;
      }>;
    });

    return rows.map(mapSolicitudIntegracionRow);
  }
}

export async function createSolicitudIntegracion(
  input: CreateSolicitudIntegracionInput,
): Promise<SolicitudIntegracionRow> {
  const codigoCuenta = requireCodigoCuenta(input.codigoCuenta);
  const bodegaExternaId = input.bodegaExternaId.trim();
  const bodegaExternaNombre = input.bodegaExternaNombre.trim();

  if (!bodegaExternaId || !bodegaExternaNombre) {
    throw new DomainServiceError(
      "Selecciona una bodega externa válida.",
      "INVALID_ARGUMENT",
    );
  }

  const created = await apiRequest<{
    idSolicitudIntegracion: string;
    bodegaExternaId: string;
    bodegaNombre: string;
    tipoIntegracion: TipoIntegracion | null;
    estado: string;
    createdAt: string;
  }>("/integracion/solicitudes", {
    method: "POST",
    auth: true,
    body: {
      codigoCuenta,
      bodegaExternaId,
      bodegaExternaNombre,
      tipoIntegracion: input.tipoIntegracion,
      ...(input.idCliente ? { idCliente: input.idCliente } : {}),
    },
  });

  return mapApiSolicitudIntegracionRow(created);
}
