"use client";

import { PolariaStatusLoading } from "@/components/shared/status/PolariaStatusLoading";
import { cn } from "@/lib/utils/cn";
import type { BodegaExternaEmbedReportOption } from "../services/cuenta-reporte-embed.client";
import { toolbarButtonClassName } from "./inventario-mercancia-report.constants";

interface InventarioMercanciaEmbedPanelProps {
  embedReports: BodegaExternaEmbedReportOption[];
  selectedEmbedReportId: string | null;
  embedViewUrl: string | null;
  embedLoading: boolean;
  embedError: string | null;
  onSelectReport: (id: string) => void;
}

export function InventarioMercanciaEmbedPanel({
  embedReports,
  selectedEmbedReportId,
  embedViewUrl,
  embedLoading,
  embedError,
  onSelectReport,
}: InventarioMercanciaEmbedPanelProps) {
  return (
    <div className="space-y-4">
      {embedReports.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {embedReports.map((report) => {
            const selected = report.id === selectedEmbedReportId;
            return (
              <button
                key={report.id}
                type="button"
                onClick={() => onSelectReport(report.id)}
                className={cn(
                  toolbarButtonClassName,
                  selected &&
                    "border-polaria-teal text-polaria-teal shadow-[0_0_20px_var(--teal-glow)]",
                )}
              >
                {report.descripcion?.trim() || "Reporte"}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="w-full overflow-hidden rounded-xl border border-polaria-t-20 bg-polaria-bg">
        {embedLoading ? (
          <PolariaStatusLoading
            embedded
            title="Preparando reporte seguro…"
            message="Estamos abriendo la visualización."
            className="py-10"
          />
        ) : null}

        {embedError ? (
          <p
            role="alert"
            className="m-4 rounded-lg border border-polaria-danger-border bg-polaria-danger-bg px-3 py-2 polaria-text-body-sm text-polaria-danger"
          >
            {embedError}
          </p>
        ) : null}

        {!embedLoading &&
        !embedError &&
        embedReports.length > 1 &&
        !selectedEmbedReportId ? (
          <p className="px-4 py-10 text-center polaria-text-body-sm text-polaria-w-50">
            Elige un reporte para visualizarlo.
          </p>
        ) : null}

        {embedViewUrl ? (
          <iframe
            title={
              embedReports.find((r) => r.id === selectedEmbedReportId)
                ?.descripcion || "Reportes bodega externa"
            }
            src={embedViewUrl}
            className="block w-full border-0"
            style={{ height: "42rem" }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : null}
      </div>
    </div>
  );
}
