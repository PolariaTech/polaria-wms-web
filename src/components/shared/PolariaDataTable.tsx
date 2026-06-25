"use client";

import { Plus, RotateCw } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface PolariaDataTableColumn<T> {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  headerClassName?: string;
  cellClassName?: string;
}

export interface PolariaDataTableProps<T> {
  title: string;
  subtitle?: string;
  isLoading: boolean;
  error: string | null;
  rows: readonly T[];
  columns: readonly PolariaDataTableColumn<T>[];
  getRowKey: (row: T) => string;
  emptyMessage: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function PolariaDataTable<T>({
  title,
  subtitle,
  isLoading,
  error,
  rows,
  columns,
  getRowKey,
  emptyMessage,
  onRefresh,
  isRefreshing = false,
  primaryAction,
  className,
}: PolariaDataTableProps<T>) {
  const showTable = !isLoading && !error;

  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-polaria-t-20 bg-polaria-t-08 backdrop-blur-sm",
        className,
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-polaria-w-08 px-5 py-4 sm:px-6">
        <div>
          <h2 className="polaria-text-card-title">{title}</h2>
          {subtitle ? (
            <p className="polaria-text-caption mt-1">{subtitle}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="polaria-text-body-sm text-polaria-w-50">
            Total: {isLoading ? "—" : rows.length}
          </span>

          {onRefresh ? (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading || isRefreshing}
              aria-label="Actualizar tabla"
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg border border-polaria-t-20 text-polaria-teal transition",
                "hover:bg-polaria-t-08 disabled:cursor-not-allowed disabled:opacity-50",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
              )}
            >
              <RotateCw
                className={cn("h-4 w-4", isRefreshing && "animate-spin")}
                strokeWidth={1.75}
                aria-hidden
              />
            </button>
          ) : null}

          {primaryAction ? (
            <button
              type="button"
              onClick={primaryAction.onClick}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl bg-polaria-teal px-4 py-2",
                "polaria-text-body-sm font-semibold text-polaria-bg transition hover:opacity-90",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
              )}
            >
              <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
              {primaryAction.label}
            </button>
          ) : null}
        </div>
      </header>

      {error ? (
        <p
          role="alert"
          className="polaria-text-body-sm px-5 py-4 text-polaria-w-50 sm:px-6"
        >
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <p className="polaria-text-body-sm px-5 py-8 text-polaria-w-50 sm:px-6">
          Cargando…
        </p>
      ) : null}

      {showTable ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="border-b border-polaria-w-08">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.id}
                    scope="col"
                    className={cn(
                      "polaria-text-label px-5 py-3 text-polaria-w-50 sm:px-6",
                      column.headerClassName,
                    )}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="polaria-text-body-sm px-5 py-10 text-center text-polaria-w-50 sm:px-6"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={getRowKey(row)}
                    className="border-t border-polaria-w-08 text-polaria-w"
                  >
                    {columns.map((column) => (
                      <td
                        key={column.id}
                        className={cn(
                          "polaria-text-body px-5 py-4 sm:px-6",
                          column.cellClassName,
                        )}
                      >
                        {column.cell(row)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
