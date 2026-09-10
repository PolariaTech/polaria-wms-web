"use client";

import { Search } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { cn } from "@/lib/utils/cn";

export interface ImpresoraTablePickerColumn<T> {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
}

interface ImpresoraTablePickerModalProps<T> {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  rows: readonly T[];
  columns: readonly ImpresoraTablePickerColumn<T>[];
  getRowKey: (row: T) => string;
  getSearchHaystack: (row: T) => string;
  selectedKey?: string | null;
  onSelect: (row: T) => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
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

export function ImpresoraTablePickerModal<T>({
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
}: ImpresoraTablePickerModalProps<T>) {
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
      <div className="relative mb-3">
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

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-3 py-3 polaria-text-body-sm text-polaria-w-50">
          {query.trim() ? "No hay filas que coincidan con la búsqueda." : emptyMessage}
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-polaria-w-08">
          <div className="max-h-[min(50vh,22rem)] overflow-auto">
            <table className="w-full border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-polaria-bg">
                <tr className="border-b border-polaria-w-08">
                  {columns.map((column) => (
                    <th
                      key={column.id}
                      className={cn(
                        "px-3 py-2 polaria-text-caption font-medium text-polaria-w-50",
                        column.className,
                      )}
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const key = getRowKey(row);
                  const selected = selectedKey === key;
                  return (
                    <tr key={key}>
                      <td colSpan={columns.length} className="p-0">
                        <button
                          type="button"
                          onClick={() => {
                            onSelect(row);
                            handleClose();
                          }}
                          className={cn(
                            "grid w-full grid-cols-[repeat(var(--cols),minmax(0,1fr))] items-center px-0 text-left transition",
                            "hover:bg-polaria-t-08 focus-visible:bg-polaria-t-08 focus-visible:outline-none",
                            selected && "bg-polaria-t-08",
                          )}
                          style={
                            {
                              "--cols": columns.length,
                            } as CSSProperties
                          }
                        >
                          {columns.map((column) => (
                            <span
                              key={column.id}
                              className={cn(
                                "px-3 py-2.5 polaria-text-body-sm text-polaria-w",
                                column.className,
                              )}
                            >
                              {column.cell(row)}
                            </span>
                          ))}
                        </button>
                      </td>
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
