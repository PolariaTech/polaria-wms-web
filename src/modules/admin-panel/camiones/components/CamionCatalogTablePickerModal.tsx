"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { PolariaFormSelect } from "@/components/shared/form/PolariaFormField";
import { cn } from "@/lib/utils/cn";

export interface CamionCatalogTableColumn<T> {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
}

interface CamionCatalogTablePickerModalProps<T> {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  rows: readonly T[];
  columns: readonly CamionCatalogTableColumn<T>[];
  getRowKey: (row: T) => string;
  getSearchHaystack: (row: T) => string;
  selectedKey?: string | null;
  onSelect: (row: T) => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
  filterOptions?: { value: string; label: string }[];
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  filterLabel?: string;
}

function normalizeSearch(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function matchesSearch(haystack: string, query: string): boolean {
  const tokens = normalizeSearch(query).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const normalized = normalizeSearch(haystack);
  return tokens.every((token) => normalized.includes(token));
}

export function CamionCatalogTablePickerModal<T>({
  open,
  onClose,
  title,
  description,
  rows,
  columns,
  getRowKey,
  getSearchHaystack,
  selectedKey = null,
  onSelect,
  searchPlaceholder = "Buscar…",
  emptyMessage = "No hay resultados.",
  filterOptions,
  filterValue = "",
  onFilterChange,
  filterLabel = "Filtrar",
}: CamionCatalogTablePickerModalProps<T>) {
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  const filtered = useMemo(() => {
    return rows.filter((row) => matchesSearch(getSearchHaystack(row), query));
  }, [getSearchHaystack, query, rows]);

  const handleClose = () => {
    setQuery("");
    onFilterChange?.("");
    onClose();
  };

  return (
    <PolariaFormModal
      open={open}
      onClose={handleClose}
      title={title}
      description={description}
      onSubmit={(event) => event.preventDefault()}
      asForm={false}
      stackLevel="elevated"
      hideHeaderClose
      footerAction={<></>}
      cancelLabel="Cerrar"
      compact
      size="lg"
    >
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-polaria-w-50"
            aria-hidden
          />
          <input
            ref={searchInputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.stopPropagation()}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            autoComplete="off"
            className={cn(
              "w-full rounded-xl border border-polaria-w-08 bg-polaria-w-08 py-2.5 pl-10 pr-4",
              "polaria-text-body-sm text-polaria-w placeholder:text-polaria-w-20 outline-none",
              "focus:border-polaria-t-20 focus:ring-1 focus:ring-polaria-t-20",
            )}
          />
        </div>

        {filterOptions && onFilterChange ? (
          <div className="w-full sm:w-48">
            <PolariaFormSelect
              id="camion-catalog-filter"
              label={filterLabel}
              value={filterValue}
              onChange={(event) => onFilterChange(event.target.value)}
              options={[
                { value: "", label: "Todos" },
                ...filterOptions,
              ]}
              compact
            />
          </div>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-3 py-3 polaria-text-body-sm text-polaria-w-50">
          {query.trim() || filterValue
            ? "No hay filas que coincidan con el filtro."
            : emptyMessage}
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-polaria-w-08">
          <div className="overflow-x-auto bg-polaria-t-08">
            <table className="w-full table-fixed border-collapse text-left">
              <thead>
                <tr className="border-b border-polaria-t-20">
                  {columns.map((column) => (
                    <th
                      key={column.id}
                      className={cn(
                        "px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50",
                        column.className,
                      )}
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
            </table>
          </div>

          <div className="max-h-[min(55dvh,24rem)] overflow-auto">
            <table className="w-full table-fixed border-collapse text-left">
              <tbody>
                {filtered.map((row) => {
                  const key = getRowKey(row);
                  const selected = selectedKey === key;
                  return (
                    <tr
                      key={key}
                      className={cn(
                        "cursor-pointer border-b border-polaria-w-08 last:border-b-0 transition",
                        "hover:bg-polaria-t-08",
                        selected && "bg-polaria-t-08",
                      )}
                      onClick={() => {
                        onSelect(row);
                        handleClose();
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onSelect(row);
                          handleClose();
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-pressed={selected}
                    >
                      {columns.map((column) => (
                        <td
                          key={column.id}
                          className={cn(
                            "px-3 py-2.5 polaria-text-body-sm text-polaria-w",
                            column.className,
                          )}
                        >
                          {column.cell(row)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PolariaFormModal>
  );
}
