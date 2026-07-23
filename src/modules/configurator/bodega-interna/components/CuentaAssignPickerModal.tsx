"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { cn } from "@/lib/utils/cn";
import type { CuentaAssignOption } from "@/modules/configurator/usuarios/services/usuarios.service";

interface CuentaAssignPickerModalProps {
  open: boolean;
  onClose: () => void;
  cuentas: CuentaAssignOption[];
  selectedCodigo?: string | null;
  onSelect: (cuenta: CuentaAssignOption) => void;
}

function normalizeSearch(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function CuentaAssignPickerModal({
  open,
  onClose,
  cuentas,
  selectedCodigo = null,
  onSelect,
}: CuentaAssignPickerModalProps) {
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
    if (!needle) return cuentas;
    return cuentas.filter((row) => {
      const haystack = normalizeSearch(
        `${row.codigoCuenta} ${row.nombreComercial}`,
      );
      return haystack.includes(needle);
    });
  }, [cuentas, query]);

  const handleClose = () => {
    setQuery("");
    onClose();
  };

  return (
    <PolariaFormModal
      open={open}
      onClose={handleClose}
      title="Seleccionar cuenta"
      description="Cuentas activas disponibles para asociar la bodega."
      onSubmit={(event) => event.preventDefault()}
      asForm={false}
      stackLevel="elevated"
      hideHeaderClose
      footerAction={<></>}
      cancelLabel="Cerrar"
      compact
      size="lg"
    >
      {cuentas.length > 4 ? (
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
            placeholder="Buscar por código o nombre comercial"
            aria-label="Buscar cuenta"
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
            ? "No hay cuentas que coincidan con la búsqueda."
            : "No hay cuentas activas registradas."}
        </p>
      ) : (
        <div className="max-h-[min(55dvh,24rem)] overflow-auto rounded-xl border border-polaria-w-08">
          <table className="w-full table-fixed border-collapse text-left">
            <colgroup>
              <col className="w-[30%]" />
              <col className="w-[70%]" />
            </colgroup>
            <thead className="sticky top-0 bg-polaria-t-08">
              <tr className="border-b border-polaria-t-20">
                <th className="px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50">
                  Código
                </th>
                <th className="px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50">
                  Nombre comercial
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const isSelected = row.codigoCuenta === selectedCodigo;
                return (
                  <tr
                    key={row.codigoCuenta}
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
                    aria-label={`Seleccionar ${row.nombreComercial}`}
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
                      {row.codigoCuenta}
                    </td>
                    <td className="px-3 py-2.5 align-middle polaria-text-body-sm">
                      {row.nombreComercial}
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
