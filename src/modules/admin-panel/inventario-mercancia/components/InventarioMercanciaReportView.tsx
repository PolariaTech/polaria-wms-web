"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
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
import { AdminCatalogListShell } from "@/modules/admin-panel/shared/components/AdminCatalogListShell";
import { InventarioMercanciaFlow } from "./InventarioMercanciaFlow";
import { InventarioMercanciaBodegaPicker } from "./InventarioMercanciaBodegaPicker";
import { InventarioMercanciaListadoTable } from "./InventarioMercanciaListadoTable";

type Step = "flow" | "bodegas" | "detalle";

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

  const handleBack = () => {
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
          <button
            type="button"
            onClick={handleBack}
            className={cn(
              "mb-6 inline-flex items-center gap-2 rounded-xl border border-polaria-t-20 bg-polaria-w-08 px-4 py-2.5",
              "polaria-text-body-sm font-medium text-polaria-w",
              "transition hover:border-polaria-teal hover:text-polaria-teal",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal",
            )}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Regresar
          </button>
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
      </section>
    </AdminCatalogListShell>
  );
}
