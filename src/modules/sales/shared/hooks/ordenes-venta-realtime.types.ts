export type OrdenVentaRealtimeEventType = "INSERT" | "UPDATE" | "DELETE";

export type OrdenVentaRealtimeTable = "orden_venta" | "orden_venta_linea";

/** Payload de `postgres_changes` de Supabase Realtime (orden venta / líneas). */
export interface OrdenVentaRealtimePostgresPayload {
  eventType: OrdenVentaRealtimeEventType;
  table: OrdenVentaRealtimeTable;
  new: Record<string, unknown>;
  old: Record<string, unknown>;
}