import { apiRequest } from "@/services/api";
import type { TipoIntegracion } from "@/modules/account-integration/constants/integration-types";
import {
  mapSolicitudIntegracionRow,
  SOLICITUD_INTEGRACION_SELECT_COLUMNS,
  type SolicitudIntegracionDbRow,
} from "@/modules/account-integration/services/integracion-bodega.service";
import {
  DEFAULT_LIST_LIMIT,
  runDomainQuery,
} from "@/lib/supabase/domain-query";

const CONFIGURATOR_SOLICITUD_INTEGRACION_SELECT = `${SOLICITUD_INTEGRACION_SELECT_COLUMNS},cuenta(nombre_comercial),solicitante:usuario!fk_sol_int_solicitante(correo,nombre)`;

interface ConfiguratorSolicitudIntegracionDbRow extends SolicitudIntegracionDbRow {
  cuenta: { nombre_comercial: string } | null;
  solicitante: { correo: string; nombre: string } | null;
}

export interface ConfiguratorSolicitudIntegracionRow {
  idSolicitudIntegracion: string;
  codigoCuenta: string;
  cuentaNombre: string;
  bodegaExternaId: string;
  bodegaNombre: string;
  tipoIntegracion: TipoIntegracion | null;
  estado: string;
  createdAt: string;
  solicitanteCorreo?: string | null;
  solicitanteNombre?: string | null;
}

function mapConfiguratorSolicitudIntegracionRow(
  row: ConfiguratorSolicitudIntegracionDbRow,
): ConfiguratorSolicitudIntegracionRow {
  const base = mapSolicitudIntegracionRow(row);

  return {
    ...base,
    codigoCuenta: row.codigo_cuenta,
    cuentaNombre: row.cuenta?.nombre_comercial?.trim() || row.codigo_cuenta,
    solicitanteCorreo: row.solicitante?.correo?.trim() || null,
    solicitanteNombre: row.solicitante?.nombre?.trim() || null,
  };
}

function mapApiConfiguratorRow(row: {
  idSolicitudIntegracion: string;
  codigoCuenta: string;
  cuentaNombre?: string;
  bodegaExternaId: string;
  bodegaNombre: string;
  tipoIntegracion: TipoIntegracion | null;
  estado: string;
  createdAt: string;
  solicitanteCorreo?: string | null;
  solicitanteNombre?: string | null;
}): ConfiguratorSolicitudIntegracionRow {
  return {
    idSolicitudIntegracion: row.idSolicitudIntegracion,
    codigoCuenta: row.codigoCuenta,
    cuentaNombre: row.cuentaNombre?.trim() || row.codigoCuenta,
    bodegaExternaId: row.bodegaExternaId,
    bodegaNombre: row.bodegaNombre,
    tipoIntegracion: row.tipoIntegracion,
    estado: row.estado,
    createdAt: row.createdAt,
    solicitanteCorreo: row.solicitanteCorreo?.trim() || null,
    solicitanteNombre: row.solicitanteNombre?.trim() || null,
  };
}

/** Lista solicitudes de integración visibles para el configurador (scope platform, solo lectura). */
export async function listSolicitudesIntegracionConfigurator(): Promise<
  ConfiguratorSolicitudIntegracionRow[]
> {
  try {
    const rows = await apiRequest<
      {
        idSolicitudIntegracion: string;
        codigoCuenta: string;
        cuentaNombre?: string;
        bodegaExternaId: string;
        bodegaNombre: string;
        tipoIntegracion: TipoIntegracion | null;
        estado: string;
        createdAt: string;
        solicitanteCorreo?: string | null;
        solicitanteNombre?: string | null;
      }[]
    >("/configurador/integracion/solicitudes", {
      method: "GET",
      auth: true,
    });

    return rows.map(mapApiConfiguratorRow);
  } catch {
    const rows = await runDomainQuery<ConfiguratorSolicitudIntegracionDbRow[]>(
      (client) => {
        const query = client
          .from("solicitud_integracion")
          .select(CONFIGURATOR_SOLICITUD_INTEGRACION_SELECT)
          .order("created_at", { ascending: false })
          .limit(DEFAULT_LIST_LIMIT);

        return query as unknown as Promise<{
          data: ConfiguratorSolicitudIntegracionDbRow[] | null;
          error: { message: string } | null;
        }>;
      },
    );

    return rows.map(mapConfiguratorSolicitudIntegracionRow);
  }
}
