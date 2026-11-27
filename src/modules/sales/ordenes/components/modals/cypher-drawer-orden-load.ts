"use client";

import { useCallback, useEffect, useState } from "react";
import { withCuentaSchema } from "@/lib/supabase/cuenta-schema";
import { getOrdenVentaDetalle } from "../../../shared/services/sales.service";
import type { OrdenVentaDetalleRow } from "../../../shared/types/sales.types";
import type { CypherStageId } from "./cypher-stages";

/** REQ-400: al abrir el Cypher solo «00 Recepción de correo» sale desplegada. */
function seccionesAbiertasAlAbrir(): ReadonlySet<CypherStageId> {
  return new Set<CypherStageId>(["correo"]);
}

interface UseCypherDrawerOrdenLoadArgs {
  idOrdenVenta: string | null;
  codigoCuenta: string | null;
  inspect: boolean;
  onResetUi: () => void;
}

export function useCypherDrawerOrdenLoad({
  idOrdenVenta,
  codigoCuenta,
  inspect,
  onResetUi,
}: UseCypherDrawerOrdenLoadArgs) {
  const [orden, setOrden] = useState<OrdenVentaDetalleRow | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStage, setActiveStage] = useState<CypherStageId>("correo");
  const [openStages, setOpenStages] = useState<ReadonlySet<CypherStageId>>(
    seccionesAbiertasAlAbrir,
  );

  const loadDetalle = useCallback(
    (id: string, cuenta: string) => {
      const run = () => getOrdenVentaDetalle({ codigoCuenta: cuenta, idOrdenVenta: id });
      if (inspect) return withCuentaSchema(cuenta, run);
      return run();
    },
    [inspect],
  );

  useEffect(() => {
    if (!idOrdenVenta || !codigoCuenta) {
      return;
    }

    onResetUi();

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setOrden(null);
    setActiveStage("correo");
    setOpenStages(seccionesAbiertasAlAbrir());

    void loadDetalle(idOrdenVenta, codigoCuenta)
      .then((detalle) => {
        if (!cancelled) setOrden(detalle);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "No se pudo cargar el detalle de la venta.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [codigoCuenta, idOrdenVenta, loadDetalle, onResetUi]);

  return {
    orden,
    setOrden,
    isLoading,
    error,
    activeStage,
    setActiveStage,
    openStages,
    setOpenStages,
  };
}
