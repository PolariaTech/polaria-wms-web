"use client";

import { useEffect, useRef } from "react";
import { getDomainSupabaseClient } from "@/lib/supabase/domain-query";

/** Suscripción Realtime a cambios de órdenes de venta de la cuenta. */
export function useOrdenesVentaSubscription(
  codigoCuenta: string | null,
  onChange: () => void,
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

    const notify = () => {
      onChangeRef.current();
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
        notify,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orden_venta_linea",
        },
        notify,
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [codigoCuenta]);
}
