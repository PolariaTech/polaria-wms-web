"use client";

import { Search, User } from "lucide-react";
import { useMemo, useState } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { cn } from "@/lib/utils/cn";
import type { OperarioDisponibleApiRow } from "@/modules/operations";
import { formatOperarioTareasLabel } from "../../services/jefe-bodega-operarios.service";

interface JefeBodegaOperarioPickerModalProps {
  open: boolean;
  onClose: () => void;
  operarios: OperarioDisponibleApiRow[];
  selectedId?: string | null;
  onSelect: (operario: OperarioDisponibleApiRow) => void;
}

function normalizeSearch(value: string): string {
  return value.trim().toLowerCase();
}

export function JefeBodegaOperarioPickerModal({
  open,
  onClose,
  operarios,
  selectedId = null,
  onSelect,
}: JefeBodegaOperarioPickerModalProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = normalizeSearch(query);
    if (!needle) return operarios;
    return operarios.filter((operario) => {
      const haystack = `${operario.nombre} ${operario.username}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [operarios, query]);

  const handleClose = () => {
    setQuery("");
    onClose();
  };

  return (
    <PolariaFormModal
      open={open}
      onClose={handleClose}
      title="Seleccionar operario"
      description="Operarios con sesión activa, ordenados por menor carga de tareas."
      onSubmit={(event) => event.preventDefault()}
      asForm={false}
      hideHeaderClose
      footerAction={<></>}
      cancelLabel="Cerrar"
      compact
      size="md"
    >
      {operarios.length > 4 ? (
        <div className="relative mb-3">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-polaria-w-50"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre o usuario"
            aria-label="Buscar operario"
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
            ? "No hay operarios que coincidan con la búsqueda."
            : "No hay operarios con sesión activa."}
        </p>
      ) : (
        <ul
          className="max-h-[min(55dvh,24rem)] space-y-2 overflow-y-auto pr-1"
          aria-label="Operarios disponibles"
        >
          {filtered.map((operario) => {
            const isSelected = operario.idUsuario === selectedId;
            return (
              <li key={operario.idUsuario}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(operario);
                    handleClose();
                  }}
                  aria-label={`Asignar a ${operario.nombre}`}
                  aria-pressed={isSelected}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal",
                    isSelected
                      ? "border-polaria-teal bg-polaria-t-08 ring-1 ring-polaria-teal"
                      : "border-polaria-w-08 bg-polaria-w-08 hover:border-polaria-t-20 hover:bg-polaria-t-08",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
                      isSelected
                        ? "border-polaria-teal bg-polaria-bg text-polaria-teal"
                        : "border-polaria-t-20 bg-polaria-t-08 text-polaria-teal",
                    )}
                    aria-hidden
                  >
                    <User className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate polaria-text-body-sm text-polaria-w">
                      {operario.nombre}
                    </span>
                    <span className="block truncate polaria-text-caption text-polaria-w-50">
                      {operario.username}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-lg border px-2 py-0.5 polaria-text-caption",
                      isSelected
                        ? "border-polaria-teal bg-polaria-bg text-polaria-teal"
                        : "border-polaria-t-20 bg-polaria-bg text-polaria-w-50",
                    )}
                  >
                    {formatOperarioTareasLabel(operario.tareasPendientes)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </PolariaFormModal>
  );
}
