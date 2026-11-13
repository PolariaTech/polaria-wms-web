"use client";

import { X } from "lucide-react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { PolariaTableBadge } from "@/components/shared/table/PolariaTableCells";
import { cn } from "@/lib/utils/cn";
import { formatEstadoOrdenVenta, variantEstadoOrdenVenta } from "../../../shared/constants/sales-status";
import type { EstadoOrdenVenta } from "../../../shared/types/sales.types";
import {
  CYPHER_STAGES,
  isCypherNavStageActive,
  type CypherStageId,
} from "./cypher-stages";

export interface OrdenVentaCypherDrawerChromeProps {
  titleId: string;
  codigo: string;
  comprador: string;
  occ: string;
  recibida: string;
  estado: EstadoOrdenVenta;
  onClose: () => void;
  stageNavRef: React.RefObject<HTMLElement | null>;
  activeStage: CypherStageId;
  scrollToStage: (stageId: CypherStageId) => void;
  isResizingWidth: boolean;
  handleResizePointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  handleResizePointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  handleResizePointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void;
}

export function OrdenVentaCypherDrawerChrome({
  titleId,
  codigo,
  comprador,
  occ,
  recibida,
  estado,
  onClose,
  stageNavRef,
  activeStage,
  scrollToStage,
  isResizingWidth,
  handleResizePointerDown,
  handleResizePointerMove,
  handleResizePointerUp,
}: OrdenVentaCypherDrawerChromeProps) {
  return (
    <>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Redimensionar panel Cypher"
        title="Arrastra para achicar o agrandar"
        onPointerDown={handleResizePointerDown}
        onPointerMove={handleResizePointerMove}
        onPointerUp={handleResizePointerUp}
        onPointerCancel={handleResizePointerUp}
        className={cn(
          // REQ-307: rail hacia dentro del Cypher (sin -translate) para que
          // el drag no caiga sobre el editor dock-left.
          "absolute inset-y-0 left-0 z-30 w-3 cursor-col-resize touch-none",
          "hover:bg-polaria-teal/40",
          isResizingWidth && "bg-polaria-teal/50",
        )}
      />
      <header className="relative z-20 flex shrink-0 flex-col border-b border-polaria-t-20 bg-polaria-bg">
        <div className="flex items-start gap-2 px-3 pb-2 pt-3 sm:gap-3 sm:px-4 sm:pt-4">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h2
                id={titleId}
                className="truncate polaria-text-body-sm font-extrabold text-polaria-w sm:polaria-text-card-title"
              >
                {codigo}
              </h2>
              <PolariaTableBadge variant={variantEstadoOrdenVenta(estado)}>
                {formatEstadoOrdenVenta(estado)}
              </PolariaTableBadge>
            </div>
            <p className="mt-1 truncate polaria-text-caption text-polaria-w-50">
              <span className="font-semibold text-polaria-w-50">{comprador}</span>
              {" · OCC "}
              {occ}
              {" · Recibida "}
              {recibida}
            </p>
          </div>
          <button
            type="button"
            title="Cerrar Cypher"
            aria-label={`Cerrar detalle de ${codigo}`}
            onClick={onClose}
            className={cn(
              "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-polaria-t-20 bg-polaria-t-08 text-polaria-teal transition",
              "hover:bg-polaria-t-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
            )}
          >
            <X className="h-4 w-4" strokeWidth={2.25} aria-hidden />
          </button>
        </div>

        <nav
          ref={stageNavRef}
          aria-label="Etapas de la orden"
          className="relative flex gap-x-0.5 overflow-x-auto overscroll-x-contain px-2 @md/cypher:gap-x-1 @md/cypher:px-3"
        >
          {CYPHER_STAGES.map((stage) => {
            const active = isCypherNavStageActive(stage.id, activeStage);
            return (
              <button
                key={stage.id}
                type="button"
                aria-current={active ? "true" : undefined}
                title={`${stage.num} ${stage.label}`}
                onClick={() => scrollToStage(stage.id)}
                className={cn(
                  "relative flex h-9 shrink-0 items-center gap-1 border-b-2 px-1.5 polaria-text-caption font-bold transition",
                  "@md/cypher:h-10 @md/cypher:gap-1.5 @md/cypher:px-2.5 @md/cypher:polaria-text-body-sm",
                  active
                    ? "border-polaria-teal text-polaria-w"
                    : "border-transparent text-polaria-w-50 hover:text-polaria-w",
                )}
              >
                <span
                  className={cn(
                    "shrink-0 tracking-[0.08em]",
                    active ? "text-polaria-teal" : "text-polaria-w-20",
                  )}
                >
                  {stage.num}
                </span>
                <span className="whitespace-nowrap">{stage.label}</span>
              </button>
            );
          })}
        </nav>
      </header>
    </>
  );
}
