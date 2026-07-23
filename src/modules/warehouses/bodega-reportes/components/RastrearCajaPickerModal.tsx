"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { PolariaFormSelect } from "@/components/shared/form/PolariaFormField";
import { cn } from "@/lib/utils/cn";
import type {
  CajaRastreableRow,
  CajaRastreoEstado,
} from "../services/rastrear-caja.service";

interface RastrearCajaPickerModalProps {
  open: boolean;
  onClose: () => void;
  cajas: CajaRastreableRow[];
  selectedId?: string | null;
  onSelect: (caja: CajaRastreableRow) => void;
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

const ESTADO_FILTER_OPTIONS: { value: CajaRastreoEstado | ""; label: string }[] =
  [
    { value: "", label: "Todos" },
    { value: "en_bodega", label: "En bodega" },
    { value: "despachada", label: "Despachadas" },
    { value: "sin_ubicacion", label: "Sin ubicación" },
  ];

export function RastrearCajaPickerModal({
  open,
  onClose,
  cajas,
  selectedId = null,
  onSelect,
}: RastrearCajaPickerModalProps) {
  const [query, setQuery] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<CajaRastreoEstado | "">("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  const filtered = useMemo(() => {
    return cajas.filter((row) => {
      if (estadoFilter && row.estado !== estadoFilter) return false;
      return matchesSearch(
        `${row.codigoLote} ${row.idPaquete} ${row.productoNombre} ${row.ubicacionCodigo ?? ""} ${row.estadoLabel}`,
        query,
      );
    });
  }, [cajas, estadoFilter, query]);

  const handleClose = () => {
    setQuery("");
    setEstadoFilter("");
    onClose();
  };

  return (
    <PolariaFormModal
      open={open}
      onClose={handleClose}
      title="Seleccionar caja"
      description="Incluye cajas en bodega y despachadas."
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
            placeholder="Buscar por código, producto o ubicación"
            aria-label="Buscar caja"
            autoComplete="off"
            spellCheck={false}
            className={cn(
              "w-full rounded-xl border border-polaria-w-08 bg-polaria-w-08 py-2.5 pl-10 pr-4",
              "polaria-text-body-sm text-polaria-w placeholder:text-polaria-w-20 outline-none",
              "focus:border-polaria-t-20 focus:ring-1 focus:ring-polaria-t-20",
            )}
          />
        </div>

        <PolariaFormSelect
          id="rastrear-caja-filter-estado"
          label="Estado"
          value={estadoFilter}
          onChange={(event) =>
            setEstadoFilter(event.target.value as CajaRastreoEstado | "")
          }
          options={ESTADO_FILTER_OPTIONS.filter((opt) => opt.value !== "").map(
            (opt) => ({
              value: opt.value,
              label: opt.label,
            }),
          )}
          placeholder="Todos"
          compact
        />

        {cajas.length > 0 ? (
          <p className="polaria-text-caption text-polaria-w-50">
            {filtered.length} de {cajas.length} cajas
          </p>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-3 py-3 polaria-text-body-sm text-polaria-w-50">
          {query.trim() || estadoFilter
            ? "No hay cajas que coincidan con la búsqueda o el filtro."
            : "No hay cajas registradas en esta bodega."}
        </p>
      ) : (
        <div className="max-h-[min(55dvh,26rem)] overflow-auto rounded-xl border border-polaria-w-08">
          <table className="w-full min-w-[36rem] table-fixed border-collapse text-left">
            <colgroup>
              <col className="w-[22%]" />
              <col className="w-[28%]" />
              <col className="w-[18%]" />
              <col className="w-[16%]" />
              <col className="w-[16%]" />
            </colgroup>
            <thead className="sticky top-0 bg-polaria-t-08">
              <tr className="border-b border-polaria-t-20">
                <th className="px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50">
                  Código
                </th>
                <th className="px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50">
                  Producto
                </th>
                <th className="px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50">
                  Ubicación
                </th>
                <th className="px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50">
                  Estado
                </th>
                <th className="px-3 py-2.5 text-right polaria-text-caption font-medium text-polaria-w-50">
                  Peso
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const isSelected = row.idLote === selectedId;
                return (
                  <tr
                    key={row.idLote}
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
                    aria-label={`Seleccionar caja ${row.codigoLote}`}
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
                      <span className="line-clamp-2">{row.codigoLote}</span>
                    </td>
                    <td className="px-3 py-2.5 align-middle polaria-text-body-sm">
                      <span className="line-clamp-2">{row.productoNombre}</span>
                    </td>
                    <td className="px-3 py-2.5 align-middle polaria-text-body-sm text-polaria-w-50">
                      {row.ubicacionCodigo ?? "—"}
                    </td>
                    <td className="px-3 py-2.5 align-middle polaria-text-body-sm text-polaria-w-50">
                      {row.estadoLabel}
                    </td>
                    <td className="px-3 py-2.5 align-middle text-right polaria-text-body-sm text-polaria-w-50">
                      {row.cantidadLabel}
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
