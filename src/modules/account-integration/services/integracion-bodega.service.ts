import {
  DEFAULT_LIST_LIMIT,
  requireCodigoCuenta,
  runDomainMutation,
  runDomainQuery,
  type TenantListParams,
} from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/domain-service-error";
import { listClientesAdmin } from "@/modules/admin-panel/services/clientes.service";
import type { TipoIntegracion } from "../constants/integration-types";
import type {
  CreateSolicitudIntegracionInput,
  SolicitudIntegracionRow,
} from "../types/integration.types";

const SOLICITUD_INTEGRACION_COLUMNS =
  "id_solicitud_integracion,codigo_cuenta,id_cliente,bodega_externa_id,bodega_externa_nombre,scraping,api,csv_plano,estado,created_at,id_solicitante";

interface SolicitudIntegracionDbRow {
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

function mapTipoIntegracionToFlags(tipoIntegracion: TipoIntegracion) {
  return {
    scraping: tipoIntegracion === "scraping",
    api: tipoIntegracion === "api",
    csv_plano: tipoIntegracion === "csv_plano",
  };
}

function mapSolicitudIntegracionRow(
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

async function resolveClienteId(codigoCuenta: string): Promise<string> {
  const clientes = await listClientesAdmin({ codigoCuenta, limit: 1 });

  if (clientes.length === 0) {
    throw new DomainServiceError(
      "No hay clientes activos en la cuenta para registrar la solicitud.",
      "INVALID_ARGUMENT",
    );
  }

  return clientes[0].idCliente;
}

export async function listSolicitudesIntegracion(
  params: TenantListParams,
): Promise<SolicitudIntegracionRow[]> {
  const codigoCuenta = requireCodigoCuenta(params.codigoCuenta);
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

export async function createSolicitudIntegracion(
  input: CreateSolicitudIntegracionInput,
): Promise<SolicitudIntegracionRow> {
  const codigoCuenta = requireCodigoCuenta(input.codigoCuenta);
  const bodegaExternaId = input.bodegaExternaId.trim();
  const bodegaExternaNombre = input.bodegaExternaNombre.trim();
  const idSolicitante = input.idSolicitante.trim();

  if (!bodegaExternaId || !bodegaExternaNombre) {
    throw new DomainServiceError(
      "Selecciona una bodega externa válida.",
      "INVALID_ARGUMENT",
    );
  }

  if (!idSolicitante) {
    throw new DomainServiceError(
      "No se encontró el usuario solicitante.",
      "INVALID_ARGUMENT",
    );
  }

  const idCliente = input.idCliente?.trim() || (await resolveClienteId(codigoCuenta));
  const flags = mapTipoIntegracionToFlags(input.tipoIntegracion);

  const row = await runDomainMutation<SolicitudIntegracionDbRow>((client) => {
    const query = client
      .from("solicitud_integracion")
      .insert({
        codigo_cuenta: codigoCuenta,
        id_cliente: idCliente,
        bodega_externa_id: bodegaExternaId,
        bodega_externa_nombre: bodegaExternaNombre,
        scraping: flags.scraping,
        api: flags.api,
        csv_plano: flags.csv_plano,
        id_solicitante: idSolicitante,
      })
      .select(SOLICITUD_INTEGRACION_COLUMNS)
      .single();

    return query as unknown as Promise<{
      data: SolicitudIntegracionDbRow | null;
      error: { message: string } | null;
    }>;
  });

  return mapSolicitudIntegracionRow(row);
}
