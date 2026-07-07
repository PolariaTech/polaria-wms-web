"use client";

import { cn } from "@/lib/utils/cn";
import type { BodegaReporteResumenCardConfig } from "../constants/bodega-reportes-config";
import type { BodegaReportesResumen } from "../types/bodega-reportes.types";

interface BodegaReportesResumenCardProps {
  config: BodegaReporteResumenCardConfig;
  resumen: BodegaReportesResumen;
  isLoading?: boolean;
}

function getCardValue(
  config: BodegaReporteResumenCardConfig,
  resumen: BodegaReportesResumen,
): string {
  if (config.id === "merma") {
    return `${resumen.mermaKg}${config.valueSuffix ?? ""}`;
  }

  const value = resumen[config.id];
  return `${value}${config.valueSuffix ?? ""}`;
}

export function BodegaReportesResumenCard({
  config,
  resumen,
  isLoading = false,
}: BodegaReportesResumenCardProps) {
  const Icon = config.icon;

  return (
    <article
      className={cn(
        "polaria-card-glow flex gap-3 rounded-2xl border p-4 sm:p-5",
        config.panelClassName,
        config.highlightBorder && "border-polaria-warning-border",
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
          config.iconWrapClassName,
        )}
      >
        <Icon className={cn("h-5 w-5", config.iconClassName)} aria-hidden />
      </div>

      <div className="min-w-0 flex-1">
        <p className="polaria-text-label text-polaria-w-50">{config.label}</p>
        <p
          className={cn(
            "mt-1 text-2xl font-semibold leading-none text-polaria-w sm:text-[1.75rem]",
            isLoading && "animate-pulse text-polaria-w-20",
          )}
        >
          {isLoading ? "—" : getCardValue(config, resumen)}
        </p>
        <p className="mt-2 polaria-text-caption text-polaria-w-50">
          {config.description}
        </p>
      </div>
    </article>
  );
}
