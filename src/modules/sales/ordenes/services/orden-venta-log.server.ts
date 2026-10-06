import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AuditoriaOperacionRow } from "@/modules/audit/types/audit.types";
import { resolveTenantSchemaForCuenta } from "@/modules/sales/shared/services/sales-catalog.server";
import type {
  OrdenVentaLogEntry,
  RecordOrdenVentaLogInput,
} from "../types/orden-venta-log.types";

const ENTIDAD_ORDEN_VENTA = "orden_venta";

const AUDIT_COLUMNS =
  "id_auditoria,codigo_cuenta,id_bodega,id_usuario,accion,entidad,entidad_id,payload,created_at";

function readPayloadString(
  payload: Record<string, unknown> | null | undefined,
  key: string,
): string | null {
  if (!payload) return null;
  const value = payload[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function mapAuditRow(row: AuditoriaOperacionRow): OrdenVentaLogEntry {
  const payload =
    row.payload && typeof row.payload === "object" && !Array.isArray(row.payload)
      ? (row.payload as Record<string, unknown>)
      : null;
  const mensaje =
    readPayloadString(payload, "mensaje") ||
    readPayloadString(payload, "resumen") ||
    defaultMensaje(row.accion);
  const autor = readPayloadString(payload, "autorNombre");

  return {
    id: row.id_auditoria,
    createdAt: row.created_at,
    accion: row.accion,
    mensaje,
    autor,
  };
}

function defaultMensaje(accion: AuditoriaOperacionRow["accion"]): string {
  switch (accion) {
    case "creacion":
      return "Orden creada.";
    case "actualizacion":
      return "Orden actualizada.";
    case "cambio_estado":
      return "Cambio de estado.";
    case "eliminacion":
      return "Orden eliminada.";
    default:
      return "Evento registrado.";
  }
}

function formatFechaLog(iso: string): string {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return iso;
  try {
    return new Intl.DateTimeFormat("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(ms));
  } catch {
    return iso;
  }
}

/** Entrada sintética cuando aún no hay filas de auditoría. */
export function buildCreacionSintetica(params: {
  createdAt: string;
  autorNombre?: string | null;
}): OrdenVentaLogEntry {
  const autor = params.autorNombre?.trim() || null;
  const when = params.createdAt;
  const mensaje = autor
    ? `Esta orden fue creada el ${formatFechaLog(when)} por ${autor}.`
    : `Esta orden fue creada el ${formatFechaLog(when)}.`;
  return {
    id: `sintetico-creacion-${when}`,
    createdAt: when,
    accion: "sintetico",
    mensaje,
    autor,
  };
}

async function loadOrdenFallback(
  admin: SupabaseClient,
  codigoCuenta: string,
  idOrdenVenta: string,
): Promise<{ createdAt: string | null; autor: string | null }> {
  const schemaName = await resolveTenantSchemaForCuenta(admin, codigoCuenta);
  const from = schemaName
    ? admin.schema(schemaName).from("orden_venta")
    : admin.from("orden_venta");

  const { data } = await from
    .select("created_at,fecha_pedido,vendedor")
    .eq("id_orden_venta", idOrdenVenta)
    .eq("codigo_cuenta", codigoCuenta)
    .maybeSingle();

  const row = data as {
    created_at?: string;
    fecha_pedido?: string;
    vendedor?: string | null;
  } | null;

  return {
    createdAt: row?.created_at || row?.fecha_pedido || null,
    autor: row?.vendedor?.trim() || null,
  };
}

export async function listOrdenVentaLogServer(params: {
  idOrdenVenta: string;
  codigoCuenta: string;
  fallbackCreatedAt?: string | null;
  fallbackAutor?: string | null;
}): Promise<OrdenVentaLogEntry[]> {
  const idOrdenVenta = params.idOrdenVenta.trim();
  const codigoCuenta = params.codigoCuenta.trim();
  if (!idOrdenVenta || !codigoCuenta) return [];

  const admin = getSupabaseAdminClient();

  let fallbackCreatedAt = params.fallbackCreatedAt?.trim() || null;
  let fallbackAutor = params.fallbackAutor?.trim() || null;

  if (admin && (!fallbackCreatedAt || !fallbackAutor)) {
    try {
      const ov = await loadOrdenFallback(admin, codigoCuenta, idOrdenVenta);
      fallbackCreatedAt = fallbackCreatedAt || ov.createdAt;
      fallbackAutor = fallbackAutor || ov.autor;
    } catch {
      /* ignore */
    }
  }

  if (!admin) {
    if (fallbackCreatedAt) {
      return [
        buildCreacionSintetica({
          createdAt: fallbackCreatedAt,
          autorNombre: fallbackAutor,
        }),
      ];
    }
    return [];
  }

  // auditoria_operacion vive en public (migración 026).
  const { data, error } = await admin
    .from("auditoria_operacion")
    .select(AUDIT_COLUMNS)
    .eq("codigo_cuenta", codigoCuenta)
    .eq("entidad", ENTIDAD_ORDEN_VENTA)
    .eq("entidad_id", idOrdenVenta)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    throw new Error(error.message || "No se pudo leer el log de la orden.");
  }

  const rows = (data ?? []) as AuditoriaOperacionRow[];
  const entries = rows.map(mapAuditRow);

  if (entries.length === 0 && fallbackCreatedAt) {
    return [
      buildCreacionSintetica({
        createdAt: fallbackCreatedAt,
        autorNombre: fallbackAutor,
      }),
    ];
  }

  return entries;
}

export async function recordOrdenVentaLogServer(
  input: RecordOrdenVentaLogInput,
): Promise<OrdenVentaLogEntry | null> {
  const admin = getSupabaseAdminClient();
  if (!admin) return null;

  const idOrdenVenta = input.idOrdenVenta.trim();
  const codigoCuenta = input.codigoCuenta.trim();
  if (!idOrdenVenta || !codigoCuenta) return null;

  const payload = {
    mensaje: input.mensaje.trim(),
    autorNombre: input.autorNombre?.trim() || null,
    ...(input.payloadExtra ?? {}),
  };

  const { data, error } = await admin
    .from("auditoria_operacion")
    .insert({
      codigo_cuenta: codigoCuenta,
      id_bodega: input.idBodega?.trim() || null,
      id_usuario: input.idUsuario?.trim() || null,
      accion: input.accion,
      entidad: ENTIDAD_ORDEN_VENTA,
      entidad_id: idOrdenVenta,
      payload,
    })
    .select(AUDIT_COLUMNS)
    .maybeSingle();

  if (error) {
    console.warn("[orden-venta-log] no se pudo registrar:", error.message);
    return null;
  }

  return data ? mapAuditRow(data as AuditoriaOperacionRow) : null;
}
