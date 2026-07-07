"use client";

import { Plus, RotateCw } from "lucide-react";
import type { ChangeEvent, ReactNode } from "react";
import { PolariaTablePaginationFooter } from "@/components/shared/table/PolariaTablePaginationFooter";
import {
  getPaginationPlaceholderCount,
  getTableBodyMinHeightStyle,
  POLARIA_TABLE_ROW_HEIGHT_CLASS,
  POLARIA_TABLE_SCROLL_CLASS,
} from "@/components/shared/table/polaria-table-layout";
import { DEFAULT_TABLE_PAGE_SIZE } from "@/constants/ui/table-pagination";
import { useClientTablePagination } from "@/hooks/table/useClientTablePagination";
import { cn } from "@/lib/utils/cn";

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
  additionalActions?: readonly {
    label: string;
    onClick?: () => void;
    variant?: "primary" | "outline";
    disabled?: boolean;
    title?: string;
  }[];
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  className?: string;
  /** Fila clickeable (p. ej. abrir detalle). */
  onRowClick?: (row: T) => void;
  getRowAriaLabel?: (row: T) => string;
  pageSize?: number;
  pagination?: boolean;
  tableClassName?: string;
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
  additionalActions,
  search,
  className,
  onRowClick,
  getRowAriaLabel,
  pageSize = DEFAULT_TABLE_PAGE_SIZE,
  pagination = true,
  tableClassName,
}: PolariaDataTableProps<T>) {
  const showTable = !isLoading && !error;
  const {
    paginatedRows,
    page,
    totalItems,
    setPage,
  } = useClientTablePagination(
    rows,
    pagination ? pageSize : rows.length || 1,
    search?.value,
  );
  const visibleRows = pagination ? paginatedRows : rows;
  const placeholderCount = getPaginationPlaceholderCount(
    visibleRows.length,
    pageSize,
    pagination,
  );

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
          {search ? (
            <input
              type="search"
              value={search.value}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                search.onChange(event.target.value)
              }
              placeholder={search.placeholder ?? "Buscar…"}
              aria-label={search.placeholder ?? "Buscar"}
              className={cn(
                "min-w-[12rem] rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-3 py-2",
                "polaria-text-body-sm text-polaria-w placeholder:text-polaria-w-20 outline-none",
                "focus:border-polaria-t-20 focus:ring-1 focus:ring-polaria-t-20",
              )}
            />
          ) : null}

          <span className="polaria-text-body-sm text-polaria-w-50">
            Total: {isLoading ? "—" : totalItems}
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

          {additionalActions?.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              disabled={action.disabled}
              title={action.title}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl px-4 py-2 polaria-text-body-sm font-semibold transition",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
                action.disabled
                  ? "cursor-not-allowed border border-polaria-w-08 text-polaria-w-20 opacity-60"
                  : action.variant === "primary"
                    ? "bg-polaria-teal text-polaria-bg hover:opacity-90"
                    : "border border-polaria-t-20 text-polaria-teal hover:bg-polaria-t-08",
              )}
            >
              {action.label}
            </button>
          ))}

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
        <p
          className="polaria-text-body-sm px-5 py-8 text-polaria-w-50 sm:px-6"
          style={pagination ? getTableBodyMinHeightStyle(pageSize) : undefined}
        >
          Cargando…
        </p>
      ) : null}

      {showTable ? (
        <div
          className={POLARIA_TABLE_SCROLL_CLASS}
          style={pagination ? getTableBodyMinHeightStyle(pageSize) : undefined}
        >
          <table className={cn("w-full text-left", tableClassName)}>
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
              {visibleRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="polaria-text-body-sm px-5 py-10 text-center text-polaria-w-50 sm:px-6"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                visibleRows.map((row) => (
                  <tr
                    key={getRowKey(row)}
                    className={cn(
                      POLARIA_TABLE_ROW_HEIGHT_CLASS,
                      "border-t border-polaria-w-08 text-polaria-w",
                      onRowClick &&
                        "cursor-pointer transition-colors hover:bg-polaria-t-08 focus-visible:bg-polaria-t-08 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-polaria-teal",
                    )}
                    onClick={
                      onRowClick
                        ? () => {
                            onRowClick(row);
                          }
                        : undefined
                    }
                    onKeyDown={
                      onRowClick
                        ? (event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              onRowClick(row);
                            }
                          }
                        : undefined
                    }
                    tabIndex={onRowClick ? 0 : undefined}
                    role={onRowClick ? "button" : undefined}
                    aria-label={
                      onRowClick && getRowAriaLabel
                        ? getRowAriaLabel(row)
                        : undefined
                    }
                  >
                    {columns.map((column) => (
                      <td
                        key={column.id}
                        className={cn(
                          "polaria-text-body align-middle px-5 py-0 sm:px-6",
                          column.cellClassName,
                        )}
                      >
                        {column.cell(row)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
              {Array.from({ length: placeholderCount }, (_, index) => (
                <tr
                  key={`placeholder-${index}`}
                  aria-hidden
                  className={cn(
                    POLARIA_TABLE_ROW_HEIGHT_CLASS,
                    "border-t border-polaria-w-08",
                  )}
                >
                  <td colSpan={columns.length} className="px-5 py-0 sm:px-6">
                    &nbsp;
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {showTable && pagination ? (
        <PolariaTablePaginationFooter
          page={page}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={setPage}
        />
      ) : null}
    </section>
  );
}
