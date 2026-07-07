"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { ROUTES } from "@/config/routes";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import { BODEGA_REPORTES_RESUMEN_CARDS } from "../constants/bodega-reportes-config";
import { getBodegaReportesData, createEmptyBodegaReportesData } from "../services/bodega-reportes.service";
import type { BodegaReportesData } from "../types/bodega-reportes.types";
import { BodegaReportesBarChart } from "./BodegaReportesBarChart";
import { BodegaReportesDonutChart } from "./BodegaReportesDonutChart";
import { BodegaReportesResumenCard } from "./BodegaReportesResumenCard";

const EMPTY_DATA = createEmptyBodegaReportesData();

export function BodegaReportesPageContent({
  operacionTabs,
}: {
  operacionTabs: ReactNode;
}) {
  const { codigoCuenta, activeBodegaId } = useCompany();
  const [data, setData] = useState<BodegaReportesData>(EMPTY_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReportes = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const next = await getBodegaReportesData({
        codigoCuenta,
        idBodega: activeBodegaId,
      });
      setData(next);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudieron cargar los reportes de bodega.",
      );
      setData(EMPTY_DATA);
    } finally {
      setIsLoading(false);
    }
  }, [activeBodegaId, codigoCuenta]);

  useEffect(() => {
    void loadReportes();
  }, [loadReportes]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <header>
        <h1 className="polaria-text-display">Reportes</h1>
        <p className="polaria-text-subtitle mt-2 text-polaria-w-50">
          Indicadores operativos de la bodega activa.
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-2">
        {operacionTabs}

        <Link
          href={ROUTES.dashboardMapa}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-polaria-t-20 px-4 py-2 text-sm font-medium text-polaria-teal transition hover:bg-polaria-t-08"
        >
          <Search className="h-4 w-4" aria-hidden />
          Rastrear caja
        </Link>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-polaria-danger-border bg-polaria-danger-bg px-4 py-3 polaria-text-body-sm text-polaria-danger"
        >
          {error}
        </p>
      ) : null}

      {!activeBodegaId ? (
        <p className="polaria-text-body-sm text-polaria-w-50">
          Selecciona una bodega activa para ver los reportes operativos.
        </p>
      ) : (
        <>
          <section aria-label="Resumen de reportes">
            <h2 className="polaria-text-body-sm font-semibold text-polaria-w">
              Resumen
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
              {BODEGA_REPORTES_RESUMEN_CARDS.map((card) => (
                <BodegaReportesResumenCard
                  key={card.id}
                  config={card}
                  resumen={data.resumen}
                  isLoading={isLoading}
                />
              ))}
            </div>
          </section>

          <section
            aria-label="Gráficos de reportes"
            className="grid grid-cols-1 gap-4 lg:grid-cols-2"
          >
            <BodegaReportesBarChart points={data.barChart} />
            <BodegaReportesDonutChart segments={data.donutChart} />
          </section>
        </>
      )}
    </main>
  );
}
