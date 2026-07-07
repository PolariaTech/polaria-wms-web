"use client";

import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowRightFromLine,
  Box,
  ClipboardList,
  PackagePlus,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { EstadoBodegaSectionView } from "../types/estado-bodega.types";
import { EstadoBodegaSlotGrid } from "./EstadoBodegaSlotGrid";

const SECTION_THEME: Record<
  EstadoBodegaSectionView["id"],
  {
    icon: LucideIcon;
    panelClassName: string;
    accentClassName: string;
    titleClassName: string;
  }
> = {
  entrada: {
    icon: Box,
    panelClassName:
      "polaria-card-glow border-polaria-t-20 bg-polaria-t-08",
    accentClassName: "shadow-[0_0_0_1px_var(--t20)]",
    titleClassName: "text-polaria-teal",
  },
  almacenamiento: {
    icon: PackagePlus,
    panelClassName:
      "polaria-card-glow border-polaria-t-20 bg-[var(--aurora-deep)]",
    accentClassName: "",
    titleClassName: "text-polaria-w",
  },
  procesamiento: {
    icon: Settings2,
    panelClassName:
      "polaria-card-glow border-polaria-t-20 bg-[var(--aurora-blue)]",
    accentClassName: "",
    titleClassName: "text-polaria-w",
  },
  salida: {
    icon: ArrowRightFromLine,
    panelClassName:
      "polaria-card-glow border-polaria-t-20 bg-[var(--aurora-teal)]",
    accentClassName: "",
    titleClassName: "text-polaria-w",
  },
};

interface EstadoBodegaSectionPanelProps {
  section: EstadoBodegaSectionView;
  className?: string;
  slotSize: number;
  compact?: boolean;
  fillHeight?: boolean;
  onOpenAlertas?: () => void;
  onOpenTareas?: () => void;
  /** Vista custodio: badge de cajas y sin alertas/tareas. */
  variant?: "operativo" | "custodio";
  titleOverride?: string;
  emptyHintOverride?: string;
}

export function EstadoBodegaSectionPanel({
  section,
  className,
  slotSize,
  compact = false,
  fillHeight = false,
  onOpenAlertas,
  onOpenTareas,
  variant = "operativo",
  titleOverride,
  emptyHintOverride,
}: EstadoBodegaSectionPanelProps) {
  const theme = SECTION_THEME[section.id];
  const Icon = theme.icon;
  const isSideSection = section.id === "entrada" || section.id === "salida";
  const isCustodio = variant === "custodio";
  const displayTitle = titleOverride ?? section.title;
  const displayEmptyHint = emptyHintOverride ?? section.emptyHint;
  const showFooterHint =
    fillHeight &&
    isSideSection &&
    displayEmptyHint &&
    section.occupiedCount === 0;

  const slotGap = 12;
  const gridWidth =
    slotSize > 0
      ? section.cols * slotSize + (section.cols - 1) * slotGap
      : undefined;

  return (
    <section
      style={
        compact && gridWidth
          ? { width: gridWidth + 20, maxWidth: "100%" }
          : undefined
      }
      className={cn(
        "flex flex-col rounded-2xl border",
        compact
          ? cn(
              "max-w-full px-2 py-3 sm:px-2.5 sm:py-4",
              fillHeight ? "h-full min-h-0" : "h-auto",
            )
          : "h-auto min-h-0 w-full p-4 sm:p-5",
        theme.panelClassName,
        className,
      )}
    >
      <header
        className={cn(
          "mb-2 flex shrink-0 gap-2",
          fillHeight || compact
            ? "w-full flex-row flex-wrap items-center justify-between"
            : "flex-wrap items-center justify-between",
        )}
      >
        <div className="flex min-w-0 shrink items-center gap-2">
          <Icon
            className={cn(
              "h-4 w-4 shrink-0",
              section.id === "salida" ? "text-polaria-teal" : theme.titleClassName,
            )}
            strokeWidth={1.75}
            aria-hidden
          />
          <h2
            className={cn(
              "truncate polaria-text-body-sm font-semibold",
              theme.titleClassName,
            )}
          >
            {displayTitle}
          </h2>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
          {isCustodio ? (
            <span
              className={cn(
                "rounded-full border border-polaria-t-20 bg-polaria-t-08 px-2.5 py-0.5 polaria-text-caption",
                section.id === "salida" ? "text-polaria-w" : "text-polaria-teal",
              )}
            >
              {section.occupiedCount} cajas
            </span>
          ) : (
            <>
              <button
                type="button"
                onClick={onOpenAlertas}
                className="inline-flex items-center gap-1 rounded-full border border-polaria-w-08 bg-polaria-w-08 px-2 py-0.5 polaria-text-caption text-polaria-w-50 transition hover:border-polaria-t-20 hover:text-polaria-teal"
                aria-label={`Ver alertas de ${displayTitle}`}
              >
                <AlertTriangle className="h-3 w-3 text-polaria-teal" aria-hidden />
                {section.alertCount}
              </button>
              <button
                type="button"
                onClick={onOpenTareas}
                className="inline-flex items-center gap-1 rounded-full border border-polaria-t-20 bg-polaria-t-08 px-2 py-0.5 polaria-text-caption text-polaria-teal transition hover:border-polaria-teal"
                aria-label={`Ver tareas pendientes de ${displayTitle}`}
              >
                <ClipboardList className="h-3 w-3" aria-hidden />
                {section.pendingTaskCount}
              </button>
              {section.showOccupancyBadge ? (
                <span className="rounded-full border border-polaria-t-20 bg-polaria-t-08 px-2.5 py-0.5 polaria-text-caption text-polaria-teal">
                  Ocupadas: {section.occupiedCount} / {section.capacity}
                </span>
              ) : null}
            </>
          )}
        </div>
      </header>

      <div
        className={cn(
          fillHeight && "flex min-h-0 flex-1 items-center justify-center",
          !fillHeight && compact && "flex justify-center",
        )}
      >
        <EstadoBodegaSlotGrid
          section={section}
          accentClassName={theme.accentClassName}
          slotSize={slotSize}
        />
      </div>

      {showFooterHint ? (
        <p className="mt-auto w-full shrink-0 pt-2 text-center polaria-text-caption text-polaria-w-50">
          {displayEmptyHint}
        </p>
      ) : null}
    </section>
  );
}
