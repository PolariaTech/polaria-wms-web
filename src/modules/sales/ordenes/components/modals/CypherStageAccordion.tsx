"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

import type { CypherStageId } from "./cypher-stages";

export function CypherStageAccordion({
  stageId,
  num,
  title,
  open,
  muted = false,
  nested = false,
  onToggle,
  headerAction,
  children,
}: {
  stageId: CypherStageId;
  /** Vacío = solo título (sub-etapas anidadas en Cambiar estado). */
  num?: string;
  title: string;
  open: boolean;
  muted?: boolean;
  /** Visual más compacto para sub-etapas bajo Cambiar estado. */
  nested?: boolean;
  onToggle: (stageId: CypherStageId) => void;
  /** Acción a la derecha del título (hermana del botón del acordeón, no anidada). */
  headerAction?: ReactNode;
  children: ReactNode;
}) {
  const panelId = `cypher-stage-${stageId}-panel`;
  return (
    <section
      id={`cypher-stage-${stageId}`}
      className={cn("scroll-mt-4", nested ? "pt-2" : "pt-3")}
    >
      <div className="relative">
        <h3>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => onToggle(stageId)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl border text-left transition",
              nested ? "px-3 py-2.5" : "px-3 py-3",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
              open
                ? "border-polaria-teal bg-polaria-t-08"
                : "border-polaria-t-20 bg-polaria-t-08 hover:border-polaria-teal",
            )}
          >
            {num ? (
              <span
                className={cn(
                  "shrink-0 polaria-text-caption font-extrabold tracking-[0.16em]",
                  muted && !open ? "text-polaria-w-20" : "text-polaria-teal",
                )}
              >
                {num}
              </span>
            ) : null}
            <span
              className={cn(
                "min-w-0 flex-1 font-extrabold",
                nested ? "polaria-text-body-sm" : "polaria-text-card-title",
                muted && !open ? "text-polaria-w-50" : "text-polaria-w",
              )}
            >
              {title}
            </span>
            {headerAction ? (
              <span aria-hidden className="w-36 shrink-0" />
            ) : null}
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-polaria-teal transition-transform duration-200",
                open && "rotate-180",
              )}
              strokeWidth={2.25}
              aria-hidden
            />
          </button>
        </h3>
        {headerAction ? (
          <div className="absolute inset-y-0 right-10 flex items-center">
            {headerAction}
          </div>
        ) : null}
      </div>
      <div id={panelId} hidden={!open} className={open ? "pt-3" : undefined}>
        {children}
      </div>
    </section>
  );
}
