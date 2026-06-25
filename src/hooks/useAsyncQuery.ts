"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DomainServiceError } from "@/lib/domain-service-error";

interface UseAsyncQueryResult<T> {
  data: T | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useAsyncQuery<T>(
  fetcher: () => Promise<T>,
  enabled = true,
): UseAsyncQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const reload = useCallback(async () => {
    if (!enabled) return;

    if (!hasLoadedRef.current) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    setError(null);

    try {
      const next = await fetcherRef.current();
      setData(next);
      hasLoadedRef.current = true;
    } catch (err: unknown) {
      setError(
        err instanceof DomainServiceError
          ? err.message
          : "No se pudo cargar los datos.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    void reload();
  }, [enabled, reload]);

  return { data, isLoading, isRefreshing, error, reload };
}
