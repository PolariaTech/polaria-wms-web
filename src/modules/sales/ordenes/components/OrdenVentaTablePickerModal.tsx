"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { cn } from "@/lib/utils/cn";

export interface OrdenVentaTablePickerRow {
  id: string;
  cells: readonly string[];
}

interface OrdenVentaTablePickerModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  columns: readonly string[];
  rows: readonly OrdenVentaTablePickerRow[];
  selectedId?: string | null;
  searchPlaceholder?: string;
  emptyLabel?: string;
  onSelect: (row: OrdenVentaTablePickerRow) => void;
}

function normalizeSearch(value: string): string {
  return value.trim().toLowerCase();
}

export function OrdenVentaTablePickerModal({
  open,
  onClose,
  title,
  description,
  columns,
  rows,
  selectedId = null,
  searchPlaceholder = "Buscar",
  emptyLabel = "No hay opciones disponibles.",
  onSelect,
}: OrdenVentaTablePickerModalProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = normalizeSearch(query);
    if (!needle) return rows;
    return rows.filter((row) =>
      row.cells.some((cell) => cell.toLowerCase().includes(needle)),
    );
  }, [query, rows]);

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
      hideHeaderClose
      footerAction={<></>}
      cancelLabel="Cerrar"
      compact
      size="md"
    >
      {rows.length > 4 ? (
        <div className="relative mb-3">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-polaria-w-50"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className={cn(
              "w-full rounded-xl border border-polaria-w-08 bg-polaria-w-08 py-2.5 pl-10 pr-4",
              "polaria-text-body-sm text-polaria-w placeholder:text-polaria-w-20 outline-none",
              "focus:border-polaria-t-20 focus:ring-1 focus:ring-polaria-t-20",
            )}
          />
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-3 py-3 polaria-text-body-sm text-polaria-w-50">
          {query.trim()
            ? "No hay resultados que coincidan con la búsqueda."
            : emptyLabel}
        </p>
      ) : (
        <div className="max-h-[min(55dvh,24rem)] overflow-auto rounded-xl border border-polaria-w-08">
          <table className="w-full table-fixed border-collapse text-left">
            <thead className="sticky top-0 bg-polaria-t-08">
              <tr className="border-b border-polaria-t-20">
                {columns.map((column) => (
                  <th
                    key={column}
                    className="px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const isSelected = row.id === selectedId;
                return (
                  <tr
                    key={row.id}
                    role="button"
                    tabIndex={0}
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
                    aria-label={`Seleccionar ${row.cells.join(" ")}`}
                    aria-pressed={isSelected}
                    className={cn(
                      "cursor-pointer border-b border-polaria-w-08 transition last:border-b-0",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-polaria-teal",
                      isSelected
                        ? "bg-polaria-t-08 text-polaria-w"
                        : "text-polaria-w hover:bg-polaria-t-08",
                    )}
                  >
                    {row.cells.map((cell, index) => (
                      <td
                        key={`${row.id}-${index}`}
                        className={cn(
                          "px-3 py-2.5 align-middle polaria-text-body-sm",
                          index === 0 ? "font-medium text-polaria-teal" : undefined,
                        )}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </PolariaFormModal>
  );
}
