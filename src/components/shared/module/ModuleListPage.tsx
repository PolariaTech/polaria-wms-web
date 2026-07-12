"use client";

import type { ReactNode } from "react";
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

export interface ModuleListColumn<T> {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  headerClassName?: string;
  cellClassName?: string;
}

export interface ModuleListPageProps<T> {
  sectionTitle?: string;
  isLoading: boolean;
  error: string | null;
  rows: readonly T[];
  columns: readonly ModuleListColumn<T>[];
  emptyMessage: string;
  getRowKey: (row: T) => string;
  className?: string;
  pageSize?: number;
  pagination?: boolean;
  tableClassName?: string;
  onRowClick?: (row: T) => void;
  getRowAriaLabel?: (row: T) => string;
}

export function ModuleListPage<T>({
  sectionTitle,
  isLoading,
  error,
  rows,
  columns,
  emptyMessage,
  getRowKey,
  className,
  pageSize = DEFAULT_TABLE_PAGE_SIZE,
  pagination = true,
  tableClassName,
  onRowClick,
  getRowAriaLabel,
}: ModuleListPageProps<T>) {
  const {
    paginatedRows,
    page,
    totalItems,
    setPage,
  } = useClientTablePagination(
    rows,
    pagination ? pageSize : rows.length || 1,
  );
  const visibleRows = pagination ? paginatedRows : rows;
  const placeholderCount = getPaginationPlaceholderCount(
    visibleRows.length,
    pageSize,
    pagination,
  );

  return (
    <section className={cn("flex flex-col gap-3", className)}>
      {sectionTitle ? (
        <h2 className="polaria-text-card-title text-polaria-w">
          {sectionTitle}
        </h2>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-4 py-3 text-polaria-w-50"
        >
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <p className="polaria-text-body-sm text-polaria-w-50">Cargando…</p>
      ) : (
        <div
          className={cn(
            POLARIA_TABLE_SCROLL_CLASS,
            "rounded-2xl border border-polaria-t-20 bg-polaria-t-08",
          )}
          style={pagination ? getTableBodyMinHeightStyle(pageSize) : undefined}
        >
          <table className={cn("w-full text-left text-sm", tableClassName)}>
            <thead className="border-b border-polaria-w-08 text-polaria-w-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.id}
                    className={cn(
                      "polaria-text-label px-4 py-3 font-medium",
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
                    className="polaria-text-body-sm px-4 py-8 text-center text-polaria-w-50"
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
                          "align-middle px-4 py-0",
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
                  <td colSpan={columns.length} className="px-4 py-0">
                    &nbsp;
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pagination ? (
            <PolariaTablePaginationFooter
              page={page}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setPage}
            />
          ) : null}
        </div>
      )}
    </section>
  );
}
