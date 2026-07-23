"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { cn } from "@/lib/utils/cn";
import { formatBodegaExternaId } from "@/modules/admin-panel";

export interface IntegracionBodegaOption {
  id: string;
  nombre: string;
}

interface IntegracionBodegaExternaPickerModalProps {
  open: boolean;
  onClose: () => void;
  bodegas: IntegracionBodegaOption[];
  selectedId?: string | null;
  onSelect: (bodega: IntegracionBodegaOption) => void;
}

function normalizeSearch(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function IntegracionBodegaExternaPickerModal({
  open,
  onClose,
  bodegas,
  selectedId = null,
  onSelect,
}: IntegracionBodegaExternaPickerModalProps) {
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
    const needle = normalizeSearch(query);
    if (!needle) return bodegas;
    return bodegas.filter((row) => {
      const haystack = normalizeSearch(
        `${row.nombre} ${row.id} ${formatBodegaExternaId(row.id)}`,
      );
      return haystack.includes(needle);
    });
  }, [bodegas, query]);

  const handleClose = () => {
    setQuery("");
    onClose();
  };

  return (
    <PolariaFormModal
      open={open}
      onClose={handleClose}
      title="Seleccionar bodega externa"
      description="Bodegas externas vinculadas a tu cuenta."
      onSubmit={(event) => event.preventDefault()}
      asForm={false}
      stackLevel="elevated"
      hideHeaderClose
      footerAction={<></>}
      cancelLabel="Cerrar"
      compact
      size="lg"
    >
      {bodegas.length > 4 ? (
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
            placeholder="Buscar por nombre o ID"
            aria-label="Buscar bodega externa"
            autoComplete="off"
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
            ? "No hay bodegas que coincidan con la búsqueda."
            : "No hay bodegas externas vinculadas."}
        </p>
      ) : (
        <div className="max-h-[min(55dvh,24rem)] overflow-auto rounded-xl border border-polaria-w-08">
          <table className="w-full table-fixed border-collapse text-left">
            <colgroup>
              <col className="w-[28%]" />
              <col className="w-[72%]" />
            </colgroup>
            <thead className="sticky top-0 bg-polaria-t-08">
              <tr className="border-b border-polaria-t-20">
                <th className="px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50">
                  ID
                </th>
                <th className="px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50">
                  Nombre
                </th>
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
                    aria-label={`Seleccionar ${row.nombre}`}
                    aria-pressed={isSelected}
                    className={cn(
                      "cursor-pointer border-b border-polaria-w-08 transition last:border-b-0",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-polaria-teal",
                      isSelected
                        ? "bg-polaria-t-08 text-polaria-w"
                        : "text-polaria-w hover:bg-polaria-t-08",
                    )}
                  >
                    <td className="px-3 py-2.5 align-middle polaria-text-body-sm font-medium text-polaria-teal">
                      {formatBodegaExternaId(row.id)}
                    </td>
                    <td className="px-3 py-2.5 align-middle polaria-text-body-sm">
                      {row.nombre}
                    </td>
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
