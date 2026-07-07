"use client";

import { useCallback } from "react";
import { useAsyncQuery } from "@/hooks/shared/useAsyncQuery";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import {
  REPORTES_PAGE_HINT,
  REPORTES_PAGE_TITLE,
  ADMIN_CATALOG_SECTION_LABEL,
} from "@/modules/admin-panel/shared/constants/admin-catalog-list";
import {
  getInventarioEtapa,
  getInventarioEtapaDestacada,
  getInventarioMercanciaReport,
} from "../services/inventario-mercancia-report.service";
import { AdminCatalogListShell } from "@/modules/admin-panel/shared/components/AdminCatalogListShell";
import { InventarioMercanciaFlow } from "./InventarioMercanciaFlow";

export function InventarioMercanciaReportView() {
  const { codigoCuenta } = useCompany();

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
    Boolean(codigoCuenta),
  );

  const report = data ?? { etapas: [] };
  const highlightedStageId = getInventarioEtapaDestacada(report);

  return (
    <AdminCatalogListShell
      sectionLabel={ADMIN_CATALOG_SECTION_LABEL}
      title={REPORTES_PAGE_TITLE}
      hint={REPORTES_PAGE_HINT}
    >
      <section className="polaria-card-glow rounded-2xl border border-polaria-t-20 bg-polaria-t-08 p-6 sm:p-8">
        <h2 className="polaria-text-label text-center text-polaria-w-50">
          Inventario de mercancía
        </h2>

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
              highlightedStageId={highlightedStageId}
            />
          </div>
        )}
      </section>
    </AdminCatalogListShell>
  );
}
