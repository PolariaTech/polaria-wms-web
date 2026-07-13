"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { PolariaFormSelect } from "@/components/shared/form/PolariaFormField";
import { cn } from "@/lib/utils/cn";
import {
  CATALOGO_UNIDAD_VISUALIZACION_LIST,
  type CatalogoUnidadVisualizacionOption,
} from "../constants/catalogo-producto";

interface CatalogoUnidadVisualizacionPickerModalProps {
  open: boolean;
  onClose: () => void;
  selectedValue?: string | null;
  onSelect: (unidad: CatalogoUnidadVisualizacionOption) => void;
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

  const normalizedHaystack = normalizeSearch(haystack);
  return tokens.every((token) => normalizedHaystack.includes(token));
}

function buildUnidadHaystack(row: CatalogoUnidadVisualizacionOption): string {
  return `${row.value} ${row.label} ${row.grupo} ${row.unidadMedida}`;
}

function uniqueSorted(values: string[]): { value: string; label: string }[] {
  return Array.from(new Set(values.filter(Boolean)))
    .sort((a, b) => a.localeCompare(b, "es"))
    .map((value) => ({ value, label: value }));
}

const UNIDAD_TABLE_COLGROUP = (
  <colgroup>
    <col className="w-[18%]" />
    <col className="w-[42%]" />
    <col className="w-[22%]" />
    <col className="w-[18%]" />
  </colgroup>
);

export function CatalogoUnidadVisualizacionPickerModal({
  open,
  onClose,
  selectedValue = null,
  onSelect,
}: CatalogoUnidadVisualizacionPickerModalProps) {
  const [query, setQuery] = useState("");
  const [grupoFilter, setGrupoFilter] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  const grupoOptions = useMemo(
    () => uniqueSorted(CATALOGO_UNIDAD_VISUALIZACION_LIST.map((row) => row.grupo)),
    [],
  );

  const filtered = useMemo(() => {
    return CATALOGO_UNIDAD_VISUALIZACION_LIST.filter((row) => {
      if (grupoFilter && row.grupo !== grupoFilter) return false;
      return matchesSearch(buildUnidadHaystack(row), query);
    });
  }, [grupoFilter, query]);

  const handleClose = () => {
    setQuery("");
    setGrupoFilter("");
    onClose();
  };

  return (
    <PolariaFormModal
      open={open}
      onClose={handleClose}
      title="Seleccionar unidad de visualización"
      description="Unidades de medida y empaque para mostrar el producto en catálogo."
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
            placeholder="Buscar por código, nombre o grupo"
            aria-label="Buscar unidad de visualización"
            autoComplete="off"
            spellCheck={false}
            className={cn(
              "w-full rounded-xl border border-polaria-w-08 bg-polaria-w-08 py-2.5 pl-10 pr-4",
              "polaria-text-body-sm text-polaria-w placeholder:text-polaria-w-20 outline-none",
              "focus:border-polaria-t-20 focus:ring-1 focus:ring-polaria-t-20",
            )}
          />
        </div>

        {grupoOptions.length > 0 ? (
          <PolariaFormSelect
            id="catalogo-unidad-filter-grupo"
            label="Grupo"
            value={grupoFilter}
            onChange={(event) => setGrupoFilter(event.target.value)}
            placeholder="Todos"
            options={grupoOptions}
            compact
          />
        ) : null}

        <p className="polaria-text-caption text-polaria-w-50">
          {filtered.length} de {CATALOGO_UNIDAD_VISUALIZACION_LIST.length} unidades
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-3 py-3 polaria-text-body-sm text-polaria-w-50">
          No hay unidades que coincidan con la búsqueda o el filtro.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-polaria-w-08">
          <div className="overflow-x-auto bg-polaria-t-08">
            <table className="w-full min-w-[36rem] table-fixed border-collapse text-left">
              {UNIDAD_TABLE_COLGROUP}
              <thead>
                <tr className="border-b border-polaria-t-20">
                  <th className="px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50">
                    Código
                  </th>
                  <th className="px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50">
                    Unidad
                  </th>
                  <th className="px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50">
                    Grupo
                  </th>
                  <th className="px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50">
                    Medida base
                  </th>
                </tr>
              </thead>
            </table>
          </div>

          <div className="max-h-[min(55dvh,26rem)] overflow-auto">
            <table className="w-full min-w-[36rem] table-fixed border-collapse text-left">
              {UNIDAD_TABLE_COLGROUP}
              <tbody>
                {filtered.map((row) => {
                  const isSelected = row.value === selectedValue;
                  return (
                    <tr
                      key={row.value}
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
                      aria-label={`Seleccionar ${row.label}`}
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
                        {row.value}
                      </td>
                      <td className="px-3 py-2.5 align-middle polaria-text-body-sm">
                        {row.label}
                      </td>
                      <td className="px-3 py-2.5 align-middle polaria-text-body-sm text-polaria-w-50">
                        {row.grupo}
                      </td>
                      <td className="px-3 py-2.5 align-middle polaria-text-body-sm text-polaria-w-50">
                        {row.unidadMedida}
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
