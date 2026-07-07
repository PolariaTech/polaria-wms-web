"use client";

import { AlertCircle, Box } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { POLARIA_REQUEST_PANEL_BODY_MIN_CLASS } from "./polaria-request-layout";
import type { PolariaRequestPanelProps } from "./polaria-request.types";

export function PolariaRequestPanel({
  title,
  icon: Icon = Box,
  pendingCount = 0,
  totalCount = 0,
  formatTotalCount,
  showPendingStatus = false,
  isLoading = false,
  error = null,
  emptyMessage,
  emptyHint,
  children,
  footer,
  className,
  "aria-label": ariaLabel,
}: PolariaRequestPanelProps) {
  const hasContent = Boolean(children);
  const showBadges = !isLoading && !error;
  const bodyMinClass = footer ? POLARIA_REQUEST_PANEL_BODY_MIN_CLASS : undefined;
  const totalLabel = formatTotalCount
    ? formatTotalCount(totalCount)
    : `${totalCount} solicitud${totalCount === 1 ? "" : "es"}`;

  const body = isLoading ? (
    <p
      className={cn(
        "px-6 py-16 text-center polaria-text-body-sm text-polaria-w-50 sm:py-20",
        bodyMinClass,
      )}
    >
      Cargando solicitudes…
    </p>
  ) : error ? (
    <p
      role="alert"
      className={cn(
        "px-6 py-16 text-center polaria-text-body-sm text-polaria-warning sm:py-20",
        bodyMinClass,
      )}
    >
      {error}
    </p>
  ) : !hasContent ? (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 text-center",
        footer ? cn("flex-1 py-8", bodyMinClass) : "py-16 sm:py-20",
      )}
    >
      <div
        className={cn(
          "mb-5 flex h-12 w-12 items-center justify-center rounded-xl",
          "border border-polaria-t-20 bg-polaria-w-08",
        )}
        aria-hidden
      >
        <Icon className="h-5 w-5 text-polaria-w-50" strokeWidth={1.75} />
      </div>
      <p className="polaria-text-card-title text-polaria-w">{emptyMessage}</p>
      {emptyHint ? (
        <p className="polaria-text-body-sm mt-2 max-w-sm text-polaria-w-50">
          {emptyHint}
        </p>
      ) : null}
    </div>
  ) : (
    <div
      className={cn(
        "flex flex-col gap-4 px-5 py-5 sm:px-6 sm:py-6",
        bodyMinClass,
      )}
    >
      {children}
    </div>
  );

  return (
    <section
      aria-label={ariaLabel ?? title}
      className={cn(
        "overflow-hidden rounded-2xl border border-polaria-t-20 bg-polaria-t-08 polaria-card-glow w-full",
        className,
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-polaria-w-08 px-5 py-4 sm:px-6">
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full border border-polaria-t-20",
            "bg-polaria-w-08 px-3.5 py-1.5 polaria-text-body-sm font-medium text-polaria-w",
          )}
        >
          <Icon
            className="h-4 w-4 shrink-0 text-polaria-teal"
            strokeWidth={1.75}
            aria-hidden
          />
          {title}
        </span>

        {showBadges ? (
          <div className="flex flex-wrap items-center gap-2">
            {showPendingStatus || pendingCount > 0 ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border",
                  "border-polaria-warning-border bg-polaria-warning-bg px-3 py-1",
                  "polaria-text-badge text-polaria-warning",
                )}
              >
                <AlertCircle
                  className="h-3.5 w-3.5 shrink-0"
                  strokeWidth={2}
                  aria-hidden
                />
                {showPendingStatus && pendingCount <= 0
                  ? "Pendiente"
                  : `${pendingCount} Pendiente${pendingCount === 1 ? "" : "s"}`}
              </span>
            ) : null}
            <span
              className={cn(
                "inline-flex rounded-full border border-polaria-t-20 bg-polaria-w-08",
                "px-3 py-1 polaria-text-badge text-polaria-teal",
              )}
            >
              {totalLabel}
            </span>
          </div>
        ) : null}
      </header>

      <div className={footer ? "flex flex-col" : undefined}>
        {body}
        {footer ? (
          <footer className="border-t border-polaria-w-08 px-5 py-4 sm:px-6 sm:py-5">
            {footer}
          </footer>
        ) : null}
      </div>
    </section>
  );
}
