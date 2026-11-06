"use client";

import { FilterX, Search } from "lucide-react";
import { PolariaDateInputDdMm } from "@/components/shared/form/PolariaDateInputDdMm";
import {
  PolariaFormField,
  POLARIA_FORM_INPUT_CLASS_COMPACT,
  POLARIA_FORM_SELECT_CLASS_COMPACT,
} from "@/components/shared/form/PolariaFormField";
import { cn } from "@/lib/utils/cn";
import {
  FILTROS_BATCH_INICIALES,
  type FiltrosBatch,
  type TipoOvBatch,
} from "./batch-seleccion";

/** El borde por defecto (8 %) casi no se ve sobre el fondo; el anillo de foco debe verse con teclado. */
const CONTROL_VISIBLE =
  "h-11 [@media(max-height:50rem)]:h-9 border-polaria-w-20 focus-visible:border-polaria-teal focus-visible:ring-2 focus-visible:ring-polaria-teal";

const TIPOS: ReadonlyArray<{ value: TipoOvBatch; label: string }> = [
  { value: "todas", label: "Todas" },
  { value: "una_ot", label: "1 OT" },
  { value: "varias_ot", label: "Más de 1 OT" },
];

interface ImpresionBatchFiltrosProps {
  filtros: FiltrosBatch;
  clientes: readonly string[];
  onChange: (filtros: FiltrosBatch) => void;
}

export function filtrosActivos(filtros: FiltrosBatch): boolean {
  return (
    filtros.texto.trim() !== "" ||
    filtros.cliente !== "" ||
    filtros.fechaEntrega !== "" ||
    filtros.tipo !== "todas"
  );
}

export function ImpresionBatchFiltros({
  filtros,
  clientes,
  onChange,
}: ImpresionBatchFiltrosProps) {
  const cambiar = (parcial: Partial<FiltrosBatch>) =>
    onChange({ ...filtros, ...parcial });
  const hayFiltros = filtrosActivos(filtros);

  return (
    <div
      role="search"
      aria-label="Filtrar órdenes de venta"
      className="grid shrink-0 gap-3 [@media(max-height:50rem)]:gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.9fr)_auto_auto] lg:items-end"
    >
      <PolariaFormField id="batch-buscar" label="Buscar" compact className="min-w-0">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-polaria-w-50"
            strokeWidth={1.75}
            aria-hidden
          />
          <input
            id="batch-buscar"
            type="search"
            value={filtros.texto}
            onChange={(event) => cambiar({ texto: event.target.value })}
            placeholder="Folio, cliente u orden de compra"
            className={cn(POLARIA_FORM_INPUT_CLASS_COMPACT, CONTROL_VISIBLE, "pl-9")}
          />
        </div>
      </PolariaFormField>

      <PolariaFormField id="batch-cliente" label="Cliente" compact className="min-w-0">
        <select
          id="batch-cliente"
          value={filtros.cliente}
          onChange={(event) => cambiar({ cliente: event.target.value })}
          className={cn(POLARIA_FORM_SELECT_CLASS_COMPACT, CONTROL_VISIBLE, "truncate")}
        >
          <option value="">Todos los clientes</option>
          {clientes.map((nombre) => (
            <option key={nombre} value={nombre}>
              {nombre}
            </option>
          ))}
        </select>
      </PolariaFormField>

      <PolariaDateInputDdMm
        id="batch-fecha-entrega"
        label="Fecha de entrega"
        value={filtros.fechaEntrega}
        onChange={(fechaEntrega) => cambiar({ fechaEntrega })}
        controlClassName={CONTROL_VISIBLE}
        compact
      />

      <fieldset className="flex min-w-0 flex-col gap-1">
        <legend className="mb-1 text-xs font-medium text-polaria-w">
          Órdenes de trabajo
        </legend>
        <div className="flex gap-1.5">
          {TIPOS.map((tipo) => {
            const activo = filtros.tipo === tipo.value;
            return (
              <button
                key={tipo.value}
                type="button"
                aria-pressed={activo}
                onClick={() => cambiar({ tipo: tipo.value })}
                className={cn(
                  "h-11 [@media(max-height:50rem)]:h-9 whitespace-nowrap rounded-xl border px-3 text-sm font-semibold transition motion-reduce:transition-none",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
                  // El activo se marca con el tinte teal y no con el relleno sólido, que es del botón principal.
                  activo
                    ? "border-polaria-teal bg-polaria-t-20 text-polaria-w"
                    : "border-polaria-w-20 text-polaria-w hover:border-polaria-t-20 hover:bg-polaria-w-08",
                )}
              >
                {tipo.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Siempre presente (apagado si no hay filtros) para que la lista no se mueva al aparecer. */}
      <button
        type="button"
        disabled={!hayFiltros}
        onClick={() => onChange(FILTROS_BATCH_INICIALES)}
        className={cn(
          "inline-flex h-11 [@media(max-height:50rem)]:h-9 items-center gap-2 whitespace-nowrap rounded-xl border border-polaria-w-20 px-3.5 text-sm font-semibold text-polaria-w transition motion-reduce:transition-none",
          "hover:border-polaria-teal hover:bg-polaria-t-08 hover:text-polaria-teal",
          "disabled:cursor-not-allowed disabled:border-polaria-w-08 disabled:text-polaria-w-50 disabled:hover:bg-transparent disabled:hover:text-polaria-w-50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
        )}
      >
        <FilterX className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        Quitar filtros
      </button>
    </div>
  );
}
