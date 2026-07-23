"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { cn } from "@/lib/utils/cn";
import type { ProveedorListRow } from "@/modules/admin-panel";

interface SolicitudProveedorPickerModalProps {
  open: boolean;
  onClose: () => void;
  proveedores: ProveedorListRow[];
  selectedId?: string | null;
  onSelect: (proveedor: ProveedorListRow) => void;
}

function normalizeSearch(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function proveedorDisplayName(row: ProveedorListRow): string {
  return row.nombre && row.nombre !== row.proveedor
    ? `${row.proveedor} — ${row.nombre}`
    : row.proveedor;
}

export function SolicitudProveedorPickerModal({
  open,
  onClose,
  proveedores,
  selectedId = null,
  onSelect,
}: SolicitudProveedorPickerModalProps) {
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
    if (!needle) return proveedores;
    return proveedores.filter((row) => {
      const haystack = normalizeSearch(
        `${row.codigo} ${row.proveedor} ${row.nombre} ${row.telefono ?? ""} ${row.email ?? ""}`,
      );
      return haystack.includes(needle);
    });
  }, [proveedores, query]);

  const handleClose = () => {
    setQuery("");
    onClose();
  };

  return (
    <PolariaFormModal
      open={open}
      onClose={handleClose}
      title="Seleccionar proveedor"
      description="Proveedores activos de la cuenta."
      onSubmit={(event) => event.preventDefault()}
      asForm={false}
      stackLevel="elevated"
      hideHeaderClose
      footerAction={<></>}
      cancelLabel="Cerrar"
      compact
      size="lg"
    >
      {proveedores.length > 4 ? (
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
            placeholder="Buscar por código, nombre o contacto"
            aria-label="Buscar proveedor"
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
            ? "No hay proveedores que coincidan con la búsqueda."
            : "No hay proveedores registrados."}
        </p>
      ) : (
        <div className="max-h-[min(55dvh,24rem)] overflow-auto rounded-xl border border-polaria-w-08">
          <table className="w-full table-fixed border-collapse text-left">
            <colgroup>
              <col className="w-[22%]" />
              <col className="w-[38%]" />
              <col className="w-[40%]" />
            </colgroup>
            <thead className="sticky top-0 bg-polaria-t-08">
              <tr className="border-b border-polaria-t-20">
                <th className="px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50">
                  Código
                </th>
                <th className="px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50">
                  Proveedor
                </th>
                <th className="px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50">
                  Contacto
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const isSelected = row.idProveedor === selectedId;
                const label = proveedorDisplayName(row);
                return (
                  <tr
                    key={row.idProveedor}
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
                    aria-label={`Seleccionar ${label}`}
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
                      {row.codigo}
                    </td>
                    <td className="px-3 py-2.5 align-middle polaria-text-body-sm">
                      {row.proveedor}
                    </td>
                    <td className="truncate px-3 py-2.5 align-middle polaria-text-body-sm text-polaria-w-50">
                      {row.nombre && row.nombre !== row.proveedor
                        ? row.nombre
                        : (row.telefono ?? row.email ?? "—")}
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
