"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getBodegaExternaEmbedEligible,
  listBodegaExternaEmbedReports,
  mintBodegaExternaEmbedViewUrl,
  type BodegaExternaEmbedReportOption,
} from "../services/cuenta-reporte-embed.client";
import type { InventarioMercanciaStep } from "./inventario-mercancia-report.constants";

interface UseInventarioMercanciaEmbedParams {
  step: InventarioMercanciaStep;
  codigoCuenta: string | null | undefined;
  inspect: boolean;
}

export function useInventarioMercanciaEmbed({
  step,
  codigoCuenta,
  inspect,
}: UseInventarioMercanciaEmbedParams) {
  const [embedEligible, setEmbedEligible] = useState(false);
  const [embedReports, setEmbedReports] = useState<
    BodegaExternaEmbedReportOption[]
  >([]);
  const [selectedEmbedReportId, setSelectedEmbedReportId] = useState<
    string | null
  >(null);
  const [embedViewUrl, setEmbedViewUrl] = useState<string | null>(null);
  const [embedLoading, setEmbedLoading] = useState(false);
  const [embedError, setEmbedError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (inspect || !codigoCuenta?.trim()) {
      setEmbedEligible(false);
      return;
    }

    void getBodegaExternaEmbedEligible().then((eligible) => {
      if (!cancelled) setEmbedEligible(eligible);
    });

    return () => {
      cancelled = true;
    };
  }, [codigoCuenta, inspect]);

  useEffect(() => {
    if (step !== "reportes") {
      return;
    }

    let cancelled = false;
    setEmbedLoading(true);
    setEmbedError(null);
    setEmbedViewUrl(null);
    setSelectedEmbedReportId(null);
    setEmbedReports([]);

    void listBodegaExternaEmbedReports()
      .then((reports) => {
        if (cancelled) return;
        setEmbedReports(reports);
        if (reports.length === 1) {
          setSelectedEmbedReportId(reports[0].id);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setEmbedError(
            err instanceof Error
              ? err.message
              : "No se pudieron cargar los reportes.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setEmbedLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [step]);

  useEffect(() => {
    if (step !== "reportes" || !selectedEmbedReportId) {
      return;
    }

    let cancelled = false;
    setEmbedLoading(true);
    setEmbedError(null);
    setEmbedViewUrl(null);

    void mintBodegaExternaEmbedViewUrl(selectedEmbedReportId)
      .then((viewUrl) => {
        if (!cancelled) setEmbedViewUrl(viewUrl);
      })
      .catch((err) => {
        if (!cancelled) {
          setEmbedError(
            err instanceof Error
              ? err.message
              : "No se pudo obtener el enlace del reporte.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setEmbedLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedEmbedReportId, step]);

  const resetEmbed = useCallback(() => {
    setEmbedViewUrl(null);
    setEmbedError(null);
    setSelectedEmbedReportId(null);
    setEmbedReports([]);
  }, []);

  return {
    embedEligible,
    embedReports,
    selectedEmbedReportId,
    setSelectedEmbedReportId,
    embedViewUrl,
    embedLoading,
    embedError,
    resetEmbed,
  };
}
