"use client";

import { AlertCircle, Box } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  INTEGRACION_EMPTY_HINT,
  INTEGRACION_EMPTY_MESSAGE,
  INTEGRACION_PAGE_HINT,
  INTEGRACION_PAGE_TITLE,
  INTEGRACION_PANEL_TITLE,
} from "../constants/integration";

export function IntegracionView() {
  const solicitudesCount = 0;

  return (
    <main className="flex flex-1 flex-col justify-start gap-8 pt-8 pb-10 sm:gap-10 sm:pt-12 sm:pb-14 lg:gap-12 lg:pt-16 lg:pb-20">
      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <h1 className="polaria-text-display">{INTEGRACION_PAGE_TITLE}</h1>
        <p className="polaria-text-subtitle mt-3 text-polaria-w-50">
          {INTEGRACION_PAGE_HINT}
        </p>
      </section>

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <section
          aria-label="Solicitudes de integración"
          className="overflow-hidden rounded-2xl border border-polaria-t-20 bg-polaria-t-08 backdrop-blur-sm"
        >
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-polaria-w-08 px-5 py-4 sm:px-6">
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full border border-polaria-t-20",
                "bg-polaria-bg px-3.5 py-1.5 polaria-text-body-sm font-medium text-polaria-w",
              )}
            >
              <Box
                className="h-4 w-4 shrink-0 text-polaria-w"
                strokeWidth={1.75}
                aria-hidden
              />
              {INTEGRACION_PANEL_TITLE}
            </span>

            <div className="flex flex-wrap items-center gap-2">
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
                Pendiente
              </span>
              <span
                className={cn(
                  "inline-flex rounded-full border border-polaria-t-20 bg-polaria-t-08",
                  "px-3 py-1 polaria-text-badge text-polaria-teal",
                )}
              >
                {solicitudesCount} solicitudes
              </span>
            </div>
          </header>

          <div className="flex flex-col items-center justify-center px-6 py-16 text-center sm:py-20">
            <div
              className={cn(
                "mb-5 flex h-12 w-12 items-center justify-center rounded-xl",
                "border border-polaria-t-20 bg-polaria-bg",
              )}
              aria-hidden
            >
              <Box className="h-5 w-5 text-polaria-w-50" strokeWidth={1.75} />
            </div>
            <p className="polaria-text-card-title text-polaria-w">
              {INTEGRACION_EMPTY_MESSAGE}
            </p>
            <p className="polaria-text-body-sm mt-2 max-w-sm text-polaria-w-50">
              {INTEGRACION_EMPTY_HINT}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
