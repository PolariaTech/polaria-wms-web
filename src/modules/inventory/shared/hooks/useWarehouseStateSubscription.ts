"use client";

import { useEffect } from "react";
import { getDomainSupabaseClient } from "@/lib/supabase/domain-query";

/** Suscripción Realtime a cambios en `warehouse_state` de una bodega. */
export function useWarehouseStateSubscription(
  idBodega: string | null,
  onChange: () => void,
): void {
  useEffect(() => {
    if (!idBodega) return;

    let client;
    try {
      client = getDomainSupabaseClient();
    } catch {
      return;
    }

    const channel = client
      .channel(`warehouse_state:${idBodega}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "warehouse_state",
          filter: `id_bodega=eq.${idBodega}`,
        },
        () => {
          onChange();
        },
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [idBodega, onChange]);
}
