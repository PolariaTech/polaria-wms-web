"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

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
}: ModuleListPageProps<T>) {
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
        <div className="overflow-x-auto rounded-2xl border border-polaria-t-20 bg-polaria-t-08">
          <table className="min-w-full text-left text-sm">
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
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="polaria-text-body-sm px-4 py-8 text-center text-polaria-w-50"
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
                        className={cn("px-4 py-3", column.cellClassName)}
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
      )}
    </section>
  );
}
