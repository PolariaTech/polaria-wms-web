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

function adminFrom(
  admin: SupabaseClient,
  schemaName: string | null,
  table: string,
) {
  return schemaName
    ? admin.schema(schemaName).from(table)
    : admin.from(table);
}

function asPayload(
  payload: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }
  return payload;
}

function readPayloadString(
  payload: Record<string, unknown> | null | undefined,
  key: string,
): string | null {
  if (!payload) return null;
  const value = payload[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function mapAuditRow(row: AuditoriaOperacionRow): OrdenVentaLogEntry {
  const payload = asPayload(
    row.payload as Record<string, unknown> | null | undefined,
  );
  const mensaje =
    readPayloadString(payload, "mensaje") ||
    readPayloadString(payload, "resumen") ||
    defaultMensaje(row.accion);
  const autor = readPayloadString(payload, "autorNombre");
  const idOrdenTrabajo = readPayloadString(payload, "idOrdenTrabajo");

  return {
    id: row.id_auditoria,
    createdAt: row.created_at,
    accion: row.accion,
    mensaje,
    autor,
    idOrdenTrabajo,
  };
}

function defaultMensaje(accion: AuditoriaOperacionRow["accion"]): string {
  switch (accion) {
    case "creacion":
      return "Orden de trabajo creada.";
    case "actualizacion":
      return "Orden de trabajo actualizada.";
    case "cambio_estado":
      return "Cambio de estado.";
    case "eliminacion":
      return "Orden de trabajo eliminada.";
    default:
      return "Evento registrado.";
  }
}

export function formatFechaLog(iso: string): string {
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

/** Entrada sintética cuando aún no hay filas de auditoría de creación. */
export function buildCreacionSintetica(params: {
  createdAt: string;
  autorNombre?: string | null;
}): OrdenVentaLogEntry {
  const autor = params.autorNombre?.trim() || null;
  const when = params.createdAt;
  const mensaje = autor
    ? `Esta orden de trabajo fue creada el ${formatFechaLog(when)} por ${autor}.`
    : `Esta orden de trabajo fue creada el ${formatFechaLog(when)}.`;
  return {
    id: `sintetico-creacion-${when}`,
    createdAt: when,
    accion: "sintetico",
    mensaje,
    autor,
    idOrdenTrabajo: null,
  };
}

/**
 * Eventos de toda la OV (sin OT) + los de la OT pedida.
 * Sin filtro OT → todos.
 */
export function filterLogEntriesForOt(
  entries: OrdenVentaLogEntry[],
  idOrdenTrabajo?: string | null,
): OrdenVentaLogEntry[] {
  const ot = idOrdenTrabajo?.trim() || "";
  if (!ot) return entries;
  return entries.filter((entry) => {
    const entryOt = entry.idOrdenTrabajo?.trim() || "";
    return !entryOt || entryOt === ot;
  });
}

/** Garantiza que el historial empiece con la creación (real o sintética). */
export function ensureCreacionEntry(
  entries: OrdenVentaLogEntry[],
  fallback: { createdAt: string; autorNombre?: string | null } | null,
): OrdenVentaLogEntry[] {
  const hasCreacion = entries.some(
    (entry) => entry.accion === "creacion" || entry.accion === "sintetico",
  );
  if (hasCreacion || !fallback?.createdAt) return entries;
  return [
    ...entries,
    buildCreacionSintetica({
      createdAt: fallback.createdAt,
      autorNombre: fallback.autorNombre,
    }),
  ];
}

async function loadOrdenFallback(
  admin: SupabaseClient,
  codigoCuenta: string,
  idOrdenVenta: string,
  schemaName: string | null,
): Promise<{ createdAt: string | null; autor: string | null }> {
  const { data } = await adminFrom(admin, schemaName, "orden_venta")
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
  idOrdenTrabajo?: string | null;
  fallbackCreatedAt?: string | null;
  fallbackAutor?: string | null;
}): Promise<OrdenVentaLogEntry[]> {
  const idOrdenVenta = params.idOrdenVenta.trim();
  const codigoCuenta = params.codigoCuenta.trim();
  if (!idOrdenVenta || !codigoCuenta) return [];

  const admin = getSupabaseAdminClient();

  let fallbackCreatedAt = params.fallbackCreatedAt?.trim() || null;
  let fallbackAutor = params.fallbackAutor?.trim() || null;
  let schemaName: string | null = null;

  if (admin) {
    try {
      schemaName = await resolveTenantSchemaForCuenta(admin, codigoCuenta);
    } catch {
      schemaName = null;
    }

    if (!fallbackCreatedAt || !fallbackAutor) {
      try {
        const ov = await loadOrdenFallback(
          admin,
          codigoCuenta,
          idOrdenVenta,
          schemaName,
        );
        fallbackCreatedAt = fallbackCreatedAt || ov.createdAt;
        fallbackAutor = fallbackAutor || ov.autor;
      } catch {
        /* ignore */
      }
    }
  }

  const fallback =
    fallbackCreatedAt
      ? { createdAt: fallbackCreatedAt, autorNombre: fallbackAutor }
      : null;

  if (!admin) {
    return fallback
      ? [
          buildCreacionSintetica({
            createdAt: fallback.createdAt,
            autorNombre: fallback.autorNombre,
          }),
        ]
      : [];
  }

  // auditoria_operacion vive en el schema emp_* (migración 062); legacy → public.
  const { data, error } = await adminFrom(
    admin,
    schemaName,
    "auditoria_operacion",
  )
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
  const entries = filterLogEntriesForOt(
    rows.map(mapAuditRow),
    params.idOrdenTrabajo,
  );

  return ensureCreacionEntry(entries, fallback);
}

export async function recordOrdenVentaLogServer(
  input: RecordOrdenVentaLogInput,
): Promise<OrdenVentaLogEntry | null> {
  const admin = getSupabaseAdminClient();
  if (!admin) return null;

  const idOrdenVenta = input.idOrdenVenta.trim();
  const codigoCuenta = input.codigoCuenta.trim();
  if (!idOrdenVenta || !codigoCuenta) return null;

  let schemaName: string | null = null;
  try {
    schemaName = await resolveTenantSchemaForCuenta(admin, codigoCuenta);
  } catch {
    schemaName = null;
  }

  const idOrdenTrabajo = input.idOrdenTrabajo?.trim() || null;
  const payload = {
    mensaje: input.mensaje.trim(),
    autorNombre: input.autorNombre?.trim() || null,
    ...(idOrdenTrabajo ? { idOrdenTrabajo } : {}),
    ...(input.payloadExtra ?? {}),
  };

  const idUsuario = input.idUsuario?.trim() || null;
  const idBodega = input.idBodega?.trim() || null;

  const { data, error } = await adminFrom(
    admin,
    schemaName,
    "auditoria_operacion",
  )
    .insert({
      codigo_cuenta: codigoCuenta,
      id_bodega: idBodega,
      id_usuario: idUsuario,
      accion: input.accion,
      entidad: ENTIDAD_ORDEN_VENTA,
      entidad_id: idOrdenVenta,
      payload,
    })
    .select(AUDIT_COLUMNS)
    .maybeSingle();

  if (error) {
    // Reintento sin FKs opcionales (usuario/bodega pueden fallar en schemas tenant).
    if (idUsuario || idBodega) {
      const retry = await adminFrom(admin, schemaName, "auditoria_operacion")
        .insert({
          codigo_cuenta: codigoCuenta,
          id_bodega: null,
          id_usuario: null,
          accion: input.accion,
          entidad: ENTIDAD_ORDEN_VENTA,
          entidad_id: idOrdenVenta,
          payload,
        })
        .select(AUDIT_COLUMNS)
        .maybeSingle();

      if (!retry.error && retry.data) {
        return mapAuditRow(retry.data as AuditoriaOperacionRow);
      }

      console.warn(
        "[orden-venta-log] no se pudo registrar:",
        retry.error?.message || error.message,
      );
      return null;
    }

    console.warn("[orden-venta-log] no se pudo registrar:", error.message);
    return null;
  }

  return data ? mapAuditRow(data as AuditoriaOperacionRow) : null;
}
