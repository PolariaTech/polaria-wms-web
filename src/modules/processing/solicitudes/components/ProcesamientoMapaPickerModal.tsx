"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { cn } from "@/lib/utils/cn";
import type { BodegaInternaVinculadaRow } from "@/modules/admin-panel";
import { matchesPickerSearch } from "./procesamiento-picker-search";

interface ProcesamientoMapaPickerModalProps {
  open: boolean;
  onClose: () => void;
  bodegas: BodegaInternaVinculadaRow[];
  selectedId?: string | null;
  onSelect: (bodega: BodegaInternaVinculadaRow) => void;
}

function buildBodegaHaystack(row: BodegaInternaVinculadaRow): string {
  return [row.nombre, row.codigo, row.idBodega].join(" ");
}

const TABLE_COLGROUP = (
  <colgroup>
    <col className="w-[28%]" />
    <col className="w-[72%]" />
  </colgroup>
);

export function ProcesamientoMapaPickerModal({
  open,
  onClose,
  bodegas,
  selectedId = null,
  onSelect,
}: ProcesamientoMapaPickerModalProps) {
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
    return bodegas.filter((row) => matchesPickerSearch(buildBodegaHaystack(row), query));
  }, [bodegas, query]);

  const handleClose = () => {
    setQuery("");
    onClose();
  };

  return (
    <PolariaFormModal
      open={open}
      onClose={handleClose}
      title="Seleccionar mapa"
      description="Bodegas internas vinculadas a la cuenta."
      onSubmit={(event) => event.preventDefault()}
      asForm={false}
      stackLevel="elevated"
      hideHeaderClose
      footerAction={<></>}
      cancelLabel="Cerrar"
      compact
      size="lg"
    >
      <div className="mb-3 flex flex-col gap-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-polaria-w-50"
            aria-hidden
          />
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.stopPropagation()}
            placeholder="Buscar por nombre o código"
            aria-label="Buscar bodega"
            autoComplete="off"
            spellCheck={false}
            className={cn(
              "w-full rounded-xl border border-polaria-w-08 bg-polaria-w-08 py-2.5 pl-10 pr-4",
              "polaria-text-body-sm text-polaria-w placeholder:text-polaria-w-20 outline-none",
              "focus:border-polaria-t-20 focus:ring-1 focus:ring-polaria-t-20",
            )}
          />
        </div>

        {bodegas.length > 0 ? (
          <p className="polaria-text-caption text-polaria-w-50">
            {filtered.length} de {bodegas.length} bodegas
          </p>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-3 py-3 polaria-text-body-sm text-polaria-w-50">
          {query.trim()
            ? "No hay bodegas que coincidan con la búsqueda."
            : "No hay bodegas internas vinculadas a la cuenta."}
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-polaria-w-08">
          <div className="overflow-x-auto bg-polaria-t-08">
            <table className="w-full min-w-[28rem] table-fixed border-collapse text-left">
              {TABLE_COLGROUP}
              <thead>
                <tr className="border-b border-polaria-t-20">
                  <th className="px-3 py-2.5 polaria-text-caption font-medium text-polaria-w-50">
                    Código
                  </th>
                  <th className="px-3 py-2.5 polaria-text-caption font-medium text-polaria-w-50">
                    Nombre
                  </th>
                </tr>
              </thead>
            </table>
          </div>

          <div className="max-h-[min(55dvh,26rem)] overflow-auto">
            <table className="w-full min-w-[28rem] table-fixed border-collapse text-left">
              {TABLE_COLGROUP}
              <tbody>
                {filtered.map((row) => {
                  const isSelected = row.idBodega === selectedId;
                  return (
                    <tr
                      key={row.idBodega}
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
                        {row.codigo}
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
        </div>
      )}
    </PolariaFormModal>
  );
}
