"use client";

/* eslint-disable react-hooks/set-state-in-effect -- carga async y suscripción Realtime */
import { useEffect, useRef, useState } from "react";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { useCompany } from "@/providers/tenant/CompanyProvider";

export interface TenantListParams {
  codigoCuenta: string;
  idBodega: string | null;
}

export interface UseTenantListResult<T> {
  rows: T[];
  isLoading: boolean;
  error: string | null;
}

export function useTenantList<T>(
  fetcher: (params: TenantListParams) => Promise<T[]>,
  enabled = true,
): UseTenantListResult<T> {
  const { codigoCuenta, activeBodegaId } = useCompany();
  const fetcherRef = useRef(fetcher);
  const canFetch = enabled && Boolean(codigoCuenta);

  const [rows, setRows] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  useEffect(() => {
    if (!canFetch || !codigoCuenta) return;

    let cancelled = false;

    setIsLoading(true);
    setError(null);

    void fetcherRef
      .current({ codigoCuenta, idBodega: activeBodegaId })
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof DomainServiceError
              ? err.message
              : "No se pudo cargar los datos.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeBodegaId, canFetch, codigoCuenta]);

  if (!enabled) {
    return { rows: [], isLoading: false, error: null };
  }

  if (!codigoCuenta) {
    return {
      rows: [],
      isLoading: false,
      error: "Falta cuenta activa del tenant.",
    };
  }

  return { rows, isLoading, error };
}
