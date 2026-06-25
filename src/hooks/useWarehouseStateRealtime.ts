"use client";

/* eslint-disable react-hooks/set-state-in-effect -- carga async y suscripción Realtime */
import { useEffect, useState } from "react";
import { listWarehouseState } from "@/modules/inventory/services/inventory.service";
import type { WarehouseStateRow } from "@/modules/inventory/types/inventory.types";
import { getDomainSupabaseClient } from "@/lib/supabase/domain-query";
import { useCompany } from "@/providers/CompanyProvider";
import { useAuthStore } from "@/stores/auth.store";

type WarehouseRealtimeEvent = "INSERT" | "UPDATE" | "DELETE";

interface PostgresChangesPayload {
  eventType: WarehouseRealtimeEvent;
  new: WarehouseStateRow;
  old: Partial<WarehouseStateRow>;
}

export interface UseWarehouseStateRealtimeOptions {
  idBodega?: string | null;
  codigoCuenta?: string | null;
}

export interface UseWarehouseStateRealtimeResult {
  rows: WarehouseStateRow[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  lastEventAt: Date | null;
}

/** Fusiona un evento Realtime en el snapshot local de `warehouse_state`. */
export function applyWarehouseStateRealtimeEvent(
  rows: WarehouseStateRow[],
  eventType: WarehouseRealtimeEvent,
  newRecord: WarehouseStateRow | null | undefined,
  oldRecord: Partial<WarehouseStateRow> | null | undefined,
): WarehouseStateRow[] {
  const id =
    eventType === "DELETE"
      ? (oldRecord?.id_warehouse_state ?? newRecord?.id_warehouse_state ?? null)
      : (newRecord?.id_warehouse_state ??
        oldRecord?.id_warehouse_state ??
        null);

  if (!id) return rows;

  if (eventType === "DELETE") {
    return rows.filter((row) => row.id_warehouse_state !== id);
  }

  if (!newRecord) return rows;

  const index = rows.findIndex((row) => row.id_warehouse_state === id);
  if (index === -1) {
    return [newRecord, ...rows];
  }

  const next = [...rows];
  next[index] = newRecord;
  return next;
}

/**
 * Suscripción Realtime a `warehouse_state` de la bodega activa.
 * Carga snapshot inicial vía Supabase y aplica INSERT/UPDATE/DELETE en vivo.
 */
export function useWarehouseStateRealtime(
  options: UseWarehouseStateRealtimeOptions = {},
): UseWarehouseStateRealtimeResult {
  const { activeBodegaId, codigoCuenta: tenantCodigoCuenta } = useCompany();
  const accessToken = useAuthStore((s) => s.accessToken);

  const idBodega = options.idBodega ?? activeBodegaId;
  const codigoCuenta = options.codigoCuenta ?? tenantCodigoCuenta;
  const canSync = Boolean(idBodega);

  const [rows, setRows] = useState<WarehouseStateRow[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastEventAt, setLastEventAt] = useState<Date | null>(null);

  useEffect(() => {
    if (!idBodega) return;

    let cancelled = false;

    setIsLoading(true);
    setError(null);

    void listWarehouseState({ idBodega, codigoCuenta })
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudo cargar el estado de inventario.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [codigoCuenta, idBodega, accessToken]);

  useEffect(() => {
    if (!idBodega) return;

    let client;
    try {
      client = getDomainSupabaseClient();
    } catch (err) {
      setIsConnected(false);
      setError(
        err instanceof Error ? err.message : "Supabase no está configurado.",
      );
      return;
    }

    const filter = `id_bodega=eq.${idBodega}`;
    const channelName = `warehouse_state:${idBodega}`;

    const handlePayload = (payload: PostgresChangesPayload) => {
      setRows((current) =>
        applyWarehouseStateRealtimeEvent(
          current,
          payload.eventType,
          payload.new,
          payload.old,
        ),
      );
      setLastEventAt(new Date());
    };

    // El builder encadenado pierde tipos tras el segundo `.on` en Supabase JS.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let rtChannel: any = client.channel(channelName);

    for (const event of ["INSERT", "UPDATE", "DELETE"] as const) {
      rtChannel = rtChannel.on(
        "postgres_changes",
        {
          event,
          schema: "public",
          table: "warehouse_state",
          filter,
        },
        handlePayload,
      );
    }

    rtChannel.subscribe((status: string, err?: Error) => {
      if (status === "SUBSCRIBED") {
        setIsConnected(true);
        setError(null);
        return;
      }

      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        setIsConnected(false);
        setError(err?.message ?? "Error de conexión Realtime.");
        return;
      }

      if (status === "CLOSED") {
        setIsConnected(false);
      }
    });

    return () => {
      setIsConnected(false);
      void client.removeChannel(rtChannel);
    };
  }, [idBodega, accessToken]);

  return {
    rows: canSync ? rows : [],
    isConnected: canSync ? isConnected : false,
    isLoading: canSync ? isLoading : false,
    error: canSync ? error : null,
    lastEventAt: canSync ? lastEventAt : null,
  };
}
