import { useCallback, useEffect, useState } from "react";
import { withCuentaSchema } from "@/lib/supabase/cuenta-schema";
import { getOrdenVentaDetalle } from "../../shared/services/sales.service";
import type { OrdenVentaDetalleRow } from "../../shared/types/sales.types";

const MENSAJE_ERROR_CARGA = "No se pudo cargar el detalle de la venta.";

export interface UseOrdenVentaDetalleDataArgs {
  idOrdenVenta: string | null;
  codigoCuenta: string | null;
  inspect: boolean;
  /** Se llama al cambiar de OV o de cuenta para descartar la OT elegida. */
  resetHija: () => void;
}

/** Carga (y recarga) el detalle de la OV, con su estado de carga y error. */
export function useOrdenVentaDetalleData({
  idOrdenVenta,
  codigoCuenta,
  inspect,
  resetHija,
}: UseOrdenVentaDetalleDataArgs) {
  const [orden, setOrden] = useState<OrdenVentaDetalleRow | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadDetalle = useCallback(
    (id: string, cuenta: string) => {
      const run = () =>
        getOrdenVentaDetalle({ codigoCuenta: cuenta, idOrdenVenta: id });
      if (inspect) {
        return withCuentaSchema(cuenta, run);
      }
      return run();
    },
    [inspect],
  );

  const reloadDetalle = useCallback(
    (options?: { silent?: boolean }) => {
      if (!idOrdenVenta || !codigoCuenta) return;

      if (!options?.silent) {
        setIsLoading(true);
      }
      setError(null);

      void loadDetalle(idOrdenVenta, codigoCuenta)
        .then((row) => {
          setOrden(row);
          setActionError(null);
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : MENSAJE_ERROR_CARGA);
        })
        .finally(() => {
          if (!options?.silent) {
            setIsLoading(false);
          }
        });
    },
    [codigoCuenta, idOrdenVenta, loadDetalle],
  );

  useEffect(() => {
    if (!idOrdenVenta || !codigoCuenta) {
      setOrden(null);
      setError(null);
      setActionError(null);
      resetHija();
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setActionError(null);
    setOrden(null);
    resetHija();

    void loadDetalle(idOrdenVenta, codigoCuenta)
      .then((row) => {
        if (!cancelled) {
          setOrden(row);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : MENSAJE_ERROR_CARGA);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [codigoCuenta, idOrdenVenta, loadDetalle, resetHija]);

  return {
    orden,
    setOrden,
    isLoading,
    error,
    actionError,
    setActionError,
    reloadDetalle,
  };
}
