"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { useAsyncQuery } from "@/hooks/shared/useAsyncQuery";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import { cn } from "@/lib/utils/cn";
import {
  REPORTES_PAGE_HINT,
  REPORTES_PAGE_TITLE,
  ADMIN_CATALOG_SECTION_LABEL,
} from "@/modules/admin-panel/shared/constants/admin-catalog-list";
import {
  getInventarioEtapa,
  getInventarioEtapasConKg,
  getInventarioMercanciaReport,
  type InventarioMercanciaEtapaId,
} from "../services/inventario-mercancia-report.service";
import {
  listBodegasParaInventarioEtapa,
  listInventarioMercanciaFilas,
  tituloListadoParaEtapa,
  type InventarioMercanciaBodegaOption,
  type InventarioMercanciaFila,
} from "../services/inventario-mercancia-listado.service";
import {
  getBodegaExternaEmbedEligible,
  mintBodegaExternaEmbedViewUrl,
} from "../services/cuenta-reporte-embed.client";
import { AdminCatalogListShell } from "@/modules/admin-panel/shared/components/AdminCatalogListShell";
import { InventarioMercanciaFlow } from "./InventarioMercanciaFlow";
import { InventarioMercanciaBodegaPicker } from "./InventarioMercanciaBodegaPicker";
import { InventarioMercanciaListadoTable } from "./InventarioMercanciaListadoTable";

type Step = "flow" | "bodegas" | "detalle" | "reportes";

const toolbarButtonClassName = cn(
  "inline-flex items-center gap-2 rounded-xl border border-polaria-t-20 bg-polaria-w-08 px-4 py-2.5",
  "polaria-text-body-sm font-medium text-polaria-w",
  "transition hover:border-polaria-teal hover:text-polaria-teal",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal",
);

export function InventarioMercanciaReportView() {
  const { codigoCuenta } = useCompany();

  const [step, setStep] = useState<Step>("flow");
  const [activeEtapa, setActiveEtapa] =
    useState<InventarioMercanciaEtapaId | null>(null);
  const [selectedBodega, setSelectedBodega] =
    useState<InventarioMercanciaBodegaOption | null>(null);

  const [bodegas, setBodegas] = useState<InventarioMercanciaBodegaOption[]>([]);
  const [bodegasLoading, setBodegasLoading] = useState(false);
  const [bodegasError, setBodegasError] = useState<string | null>(null);

  const [filas, setFilas] = useState<InventarioMercanciaFila[]>([]);
  const [filasLoading, setFilasLoading] = useState(false);
  const [filasError, setFilasError] = useState<string | null>(null);

  const [embedEligible, setEmbedEligible] = useState(false);
  const [embedViewUrl, setEmbedViewUrl] = useState<string | null>(null);
  const [embedLoading, setEmbedLoading] = useState(false);
  const [embedError, setEmbedError] = useState<string | null>(null);

  const fetchReport = useCallback(() => {
    if (!codigoCuenta) {
      return Promise.resolve({
        etapas: [],
      });
    }

    return getInventarioMercanciaReport(codigoCuenta);
  }, [codigoCuenta]);

  const { data, isLoading, error } = useAsyncQuery(
    fetchReport,
    Boolean(codigoCuenta) && step === "flow",
  );

  const report = data ?? { etapas: [] };
  const highlightedStageIds = getInventarioEtapasConKg(report);
  // Solo cuentas con fila activa en `cuenta_reporte_embed` (p. ej. JBR → TCI).
  const showReportesExterna =
    Boolean(codigoCuenta) &&
    embedEligible &&
    activeEtapa === "bodega_externa" &&
    selectedBodega?.tipo === "externa" &&
    (step === "detalle" || step === "reportes");

  useEffect(() => {
    let cancelled = false;

    if (!codigoCuenta?.trim()) {
      setEmbedEligible(false);
      return;
    }

    void getBodegaExternaEmbedEligible().then((eligible) => {
      if (!cancelled) setEmbedEligible(eligible);
    });

    return () => {
      cancelled = true;
    };
  }, [codigoCuenta]);

  const loadBodegas = useCallback(
    async (etapaId: InventarioMercanciaEtapaId) => {
      if (!codigoCuenta?.trim()) {
        setBodegas([]);
        return;
      }
      setBodegasLoading(true);
      setBodegasError(null);
      try {
        const rows = await listBodegasParaInventarioEtapa({
          codigoCuenta,
          etapaId,
        });
        setBodegas(rows);
      } catch (err) {
        setBodegas([]);
        setBodegasError(
          err instanceof Error ? err.message : "No se pudieron cargar las bodegas.",
        );
      } finally {
        setBodegasLoading(false);
      }
    },
    [codigoCuenta],
  );

  const loadFilas = useCallback(async () => {
    if (!codigoCuenta?.trim() || !selectedBodega) {
      setFilas([]);
      return;
    }
    setFilasLoading(true);
    setFilasError(null);
    try {
      const rows = await listInventarioMercanciaFilas({
        codigoCuenta,
        idBodega: selectedBodega.idBodega,
      });
      setFilas(rows);
    } catch (err) {
      setFilas([]);
      setFilasError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar el inventario de la bodega.",
      );
    } finally {
      setFilasLoading(false);
    }
  }, [codigoCuenta, selectedBodega]);

  useEffect(() => {
    if (step === "bodegas" && activeEtapa) {
      void loadBodegas(activeEtapa);
    }
  }, [activeEtapa, loadBodegas, step]);

  useEffect(() => {
    if (step === "detalle" && selectedBodega) {
      void loadFilas();
    }
  }, [loadFilas, selectedBodega, step]);

  useEffect(() => {
    if (step !== "reportes") {
      return;
    }

    let cancelled = false;
    setEmbedLoading(true);
    setEmbedError(null);
    setEmbedViewUrl(null);

    void mintBodegaExternaEmbedViewUrl()
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
  }, [step]);

  const handleSelectStage = (id: InventarioMercanciaEtapaId) => {
    setActiveEtapa(id);
    setSelectedBodega(null);
    setFilas([]);
    setStep("bodegas");
  };

  const handleSelectBodega = (bodega: InventarioMercanciaBodegaOption) => {
    setSelectedBodega(bodega);
    setStep("detalle");
  };

  const handleOpenReportesExterna = () => {
    if (!selectedBodega || selectedBodega.tipo !== "externa") {
      return;
    }
    setStep("reportes");
  };

  const handleBack = () => {
    if (step === "reportes") {
      setEmbedViewUrl(null);
      setEmbedError(null);
      setStep("detalle");
      return;
    }
    if (step === "detalle") {
      setSelectedBodega(null);
      setFilas([]);
      setFilasError(null);
      setStep("bodegas");
      return;
    }
    if (step === "bodegas") {
      setActiveEtapa(null);
      setBodegas([]);
      setBodegasError(null);
      setStep("flow");
    }
  };

  return (
    <AdminCatalogListShell
      sectionLabel={ADMIN_CATALOG_SECTION_LABEL}
      title={REPORTES_PAGE_TITLE}
      hint={REPORTES_PAGE_HINT}
    >
      <section className="polaria-card-glow rounded-2xl border border-polaria-t-20 bg-polaria-t-08 p-6 sm:p-8">
        {step !== "flow" ? (
          <div className="mb-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleBack}
              className={toolbarButtonClassName}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Regresar
            </button>

            {showReportesExterna ? (
              <button
                type="button"
                onClick={handleOpenReportesExterna}
                className={cn(
                  toolbarButtonClassName,
                  "border-polaria-teal text-polaria-teal shadow-[0_0_20px_var(--teal-glow)]",
                )}
              >
                <BarChart3 className="h-4 w-4" aria-hidden />
                Reportes
              </button>
            ) : null}
          </div>
        ) : (
          <h2 className="polaria-text-label text-center text-polaria-w-50">
            Inventario de mercancía
          </h2>
        )}

        {step === "flow" ? (
          <>
            {error ? (
              <p
                role="alert"
                className="mt-6 rounded-lg border border-polaria-danger-border bg-polaria-danger-bg px-3 py-2 polaria-text-body-sm text-polaria-danger"
              >
                {error}
              </p>
            ) : null}

            {!codigoCuenta ? (
              <p className="mt-6 text-center polaria-text-body-sm text-polaria-w-50">
                No se encontró la cuenta activa.
              </p>
            ) : isLoading ? (
              <p className="mt-6 text-center polaria-text-body-sm text-polaria-w-50">
                Cargando inventario…
              </p>
            ) : (
              <div className="mt-6">
                <InventarioMercanciaFlow
                  proveedorKg={getInventarioEtapa(report, "proveedor").kg}
                  transporteKg={getInventarioEtapa(report, "transporte").kg}
                  bodegaInternaKg={getInventarioEtapa(report, "bodega_interna").kg}
                  bodegaExternaKg={getInventarioEtapa(report, "bodega_externa").kg}
                  ventasKg={getInventarioEtapa(report, "ventas").kg}
                  highlightedStageIds={highlightedStageIds}
                  onSelectStage={handleSelectStage}
                />
              </div>
            )}
          </>
        ) : null}

        {step === "bodegas" && activeEtapa ? (
          <InventarioMercanciaBodegaPicker
            title={tituloListadoParaEtapa(activeEtapa)}
            bodegas={bodegas}
            isLoading={bodegasLoading}
            error={bodegasError}
            onSelect={handleSelectBodega}
          />
        ) : null}

        {step === "detalle" && selectedBodega ? (
          <InventarioMercanciaListadoTable
            warehouseName={selectedBodega.nombre}
            rows={filas}
            isLoading={filasLoading}
            error={filasError}
            onRefresh={() => void loadFilas()}
          />
        ) : null}

        {step === "reportes" ? (
          <div className="w-full overflow-hidden rounded-xl border border-polaria-t-20 bg-polaria-bg">
            {embedLoading ? (
              <p className="px-4 py-10 text-center polaria-text-body-sm text-polaria-w-50">
                Preparando reporte seguro…
              </p>
            ) : null}

            {embedError ? (
              <p
                role="alert"
                className="m-4 rounded-lg border border-polaria-danger-border bg-polaria-danger-bg px-3 py-2 polaria-text-body-sm text-polaria-danger"
              >
                {embedError}
              </p>
            ) : null}

            {embedViewUrl ? (
              <iframe
                title="Reportes bodega externa"
                src={embedViewUrl}
                className="block w-full border-0"
                style={{ height: "42rem" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : null}
          </div>
        ) : null}
      </section>
    </AdminCatalogListShell>
  );
}
