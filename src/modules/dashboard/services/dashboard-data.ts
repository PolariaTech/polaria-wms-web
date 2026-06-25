import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  DashboardMetricResponse,
  DashboardQueryContext,
  DashboardWidgetId,
} from "../types/dashboard.types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CountQuery = any;

async function countRows(
  table: string,
  applyFilters: (query: CountQuery) => CountQuery,
): Promise<DashboardMetricResponse> {
  try {
    const supabase = createSupabaseBrowserClient();
    const base = supabase.from(table).select("*", { count: "exact", head: true });
    const { count, error } = await applyFilters(base);

    if (error) {
      return {
        ok: false,
        message:
          error.message ||
          "No se pudo consultar los datos. Verifica permisos RLS o conexión.",
      };
    }

    return { ok: true, count: count ?? 0 };
  } catch {
    return {
      ok: false,
      message:
        "Supabase no está configurado o la sesión no está disponible para lecturas.",
    };
  }
}

export async function fetchDashboardWidgetMetric(
  widgetId: DashboardWidgetId,
  context: DashboardQueryContext,
): Promise<DashboardMetricResponse> {
  const { codigoCuenta, idBodega, idUsuario } = context;

  switch (widgetId) {
    case "ov-pendientes":
      if (!codigoCuenta) {
        return { ok: false, message: "Falta cuenta activa para consultar OV." };
      }
      return countRows("orden_venta", (query) =>
        query
          .eq("codigo_cuenta", codigoCuenta)
          .in("estado", [
            "confirmada",
            "en_preparacion",
            "parcialmente_despachada",
          ]),
      );

    case "sol-compra":
      if (!codigoCuenta) {
        return {
          ok: false,
          message: "Falta cuenta activa para consultar solicitudes.",
        };
      }
      return countRows("solicitud_compra", (query) =>
        query
          .eq("codigo_cuenta", codigoCuenta)
          .in("estado", ["borrador", "pendiente_aprobacion"]),
      );

    case "alertas-cuenta":
      if (!codigoCuenta) {
        return { ok: false, message: "Falta cuenta activa para alertas." };
      }
      return countRows("alerta_operativa", (query) =>
        query.eq("codigo_cuenta", codigoCuenta).eq("estado", "abierta"),
      );

    case "stock-resumido":
      if (!idBodega) {
        return { ok: false, message: "Selecciona una bodega activa." };
      }
      return countRows("warehouse_state", (query) =>
        query.eq("id_bodega", idBodega),
      );

    case "tareas-cola":
      if (!idBodega) {
        return { ok: false, message: "Selecciona una bodega activa." };
      }
      return countRows("tarea_cola", (query) =>
        query.eq("id_bodega", idBodega).eq("estado", "pendiente").is(
          "id_asignado",
          null,
        ),
      );

    case "alertas-bodega":
      if (!idBodega) {
        return { ok: false, message: "Selecciona una bodega activa." };
      }
      return countRows("alerta_operativa", (query) =>
        query.eq("id_bodega", idBodega).eq("estado", "abierta"),
      );

    case "tareas-asignadas":
      if (!idBodega || !idUsuario) {
        return {
          ok: false,
          message: "Falta bodega activa o usuario para tareas asignadas.",
        };
      }
      return countRows("tarea_cola", (query) =>
        query
          .eq("id_bodega", idBodega)
          .eq("id_asignado", idUsuario)
          .eq("estado", "pendiente"),
      );

    case "cola-procesamiento":
      if (!idBodega) {
        return { ok: false, message: "Selecciona una bodega activa." };
      }
      return countRows("solicitud_procesamiento", (query) =>
        query
          .eq("id_bodega", idBodega)
          .in("estado", ["pendiente", "en_proceso", "pendiente_cierre"]),
      );

    case "guias-transporte":
      if (!codigoCuenta) {
        return { ok: false, message: "Falta cuenta activa para guías." };
      }
      return countRows("guia_envio", (query) =>
        query
          .eq("codigo_cuenta", codigoCuenta)
          .in("estado", ["generada", "asignada", "en_transito"]),
      );

    default:
      return { ok: false, message: "Widget sin fuente de datos configurada." };
  }
}
