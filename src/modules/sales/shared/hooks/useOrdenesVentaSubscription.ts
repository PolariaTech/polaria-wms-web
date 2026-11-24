"use client";

import { useEffect, useRef } from "react";
import { getDomainSupabaseClient } from "@/lib/supabase/domain-query";
import type {
  OrdenVentaRealtimeEventType,
  OrdenVentaRealtimePostgresPayload,
  OrdenVentaRealtimeTable,
} from "./ordenes-venta-realtime.types";

function toPayload(
  table: OrdenVentaRealtimeTable,
  raw: {
    eventType: string;
    new: Record<string, unknown>;
    old: Record<string, unknown>;
  },
): OrdenVentaRealtimePostgresPayload {
  return {
    table,
    eventType: raw.eventType as OrdenVentaRealtimeEventType,
    new: raw.new ?? {},
    old: raw.old ?? {},
  };
}

/** Suscripción Realtime a cambios de órdenes de venta de la cuenta. */
export function useOrdenesVentaSubscription(
  codigoCuenta: string | null,
  onChange: (payload: OrdenVentaRealtimePostgresPayload) => void,
): void {
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!codigoCuenta) return;

    let client;
    try {
      client = getDomainSupabaseClient();
    } catch {
      return;
    }

    const notify = (table: OrdenVentaRealtimeTable, raw: unknown) => {
      if (
        !raw ||
        typeof raw !== "object" ||
        !("eventType" in raw) ||
        typeof (raw as { eventType: unknown }).eventType !== "string"
      ) {
        return;
      }
      const record = raw as {
        eventType: string;
        new: Record<string, unknown>;
        old: Record<string, unknown>;
      };
      onChangeRef.current(toPayload(table, record));
    };

    const channel = client
      .channel(`orden_venta:${codigoCuenta}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orden_venta",
          filter: `codigo_cuenta=eq.${codigoCuenta}`,
        },
        (payload) => {
          notify("orden_venta", payload);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orden_venta_linea",
        },
        (payload) => {
          notify("orden_venta_linea", payload);
        },
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [codigoCuenta]);
}