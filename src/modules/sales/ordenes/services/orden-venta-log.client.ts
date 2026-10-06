import { useAuthStore } from "@/stores/auth.store";
import type { TipoAuditoria } from "@/modules/audit/types/audit.types";
import type { OrdenVentaLogEntry } from "../types/orden-venta-log.types";

function authHeaders(): HeadersInit {
  const accessToken = useAuthStore.getState().accessToken;
  return accessToken
    ? {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      }
    : { "Content-Type": "application/json" };
}

export async function fetchOrdenVentaLog(params: {
  idOrdenVenta: string;
  codigoCuenta: string;
  createdAt?: string | null;
  autor?: string | null;
}): Promise<OrdenVentaLogEntry[]> {
  const id = params.idOrdenVenta.trim();
  const codigoCuenta = params.codigoCuenta.trim();
  if (!id || !codigoCuenta) return [];

  const qs = new URLSearchParams({ codigoCuenta });
  if (params.createdAt?.trim()) qs.set("createdAt", params.createdAt.trim());
  if (params.autor?.trim()) qs.set("autor", params.autor.trim());

  const url = `/api/ventas/ordenes/${encodeURIComponent(id)}/log?${qs.toString()}`;
  const response = await fetch(url, {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!response.ok) return [];
  const data = (await response.json()) as { entries?: OrdenVentaLogEntry[] };
  return Array.isArray(data.entries) ? data.entries : [];
}

/** Registra un evento de log (best-effort; no bloquea el flujo de negocio). */
export async function postOrdenVentaLog(params: {
  idOrdenVenta: string;
  codigoCuenta: string;
  accion: TipoAuditoria;
  mensaje: string;
  idBodega?: string | null;
  idUsuario?: string | null;
  autorNombre?: string | null;
  payloadExtra?: Record<string, unknown>;
}): Promise<void> {
  const id = params.idOrdenVenta.trim();
  const codigoCuenta = params.codigoCuenta.trim();
  if (!id || !codigoCuenta || !params.mensaje.trim()) return;

  try {
    await fetch(`/api/ventas/ordenes/${encodeURIComponent(id)}/log`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        codigoCuenta,
        accion: params.accion,
        mensaje: params.mensaje.trim(),
        idBodega: params.idBodega ?? null,
        idUsuario: params.idUsuario ?? null,
        autorNombre: params.autorNombre ?? null,
        payloadExtra: params.payloadExtra ?? undefined,
      }),
    });
  } catch {
    /* ignore */
  }
}
