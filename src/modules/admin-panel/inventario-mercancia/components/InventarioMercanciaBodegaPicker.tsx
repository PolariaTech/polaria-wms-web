"use client";

import { ArrowRight, Warehouse } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { InventarioMercanciaBodegaOption } from "../services/inventario-mercancia-listado.service";

interface InventarioMercanciaBodegaPickerProps {
  title: string;
  bodegas: InventarioMercanciaBodegaOption[];
  isLoading: boolean;
  error: string | null;
  onSelect: (bodega: InventarioMercanciaBodegaOption) => void;
}

export function InventarioMercanciaBodegaPicker({
  title,
  bodegas,
  isLoading,
  error,
  onSelect,
}: InventarioMercanciaBodegaPickerProps) {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <h3 className="polaria-text-body-sm font-semibold text-polaria-w">{title}</h3>
      <p className="mt-1 polaria-text-caption text-polaria-w-50">
        Seleccioná la bodega para ver el detalle del inventario.
      </p>

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-polaria-danger-border bg-polaria-danger-bg px-3 py-2 polaria-text-body-sm text-polaria-danger"
        >
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <p className="mt-6 text-center polaria-text-body-sm text-polaria-w-50">
          Cargando bodegas…
        </p>
      ) : bodegas.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-polaria-t-20 px-4 py-8 text-center polaria-text-body-sm text-polaria-w-50">
          No hay bodegas vinculadas para esta etapa.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {bodegas.map((bodega) => (
            <li key={bodega.idBodega}>
              <button
                type="button"
                onClick={() => onSelect(bodega)}
                className={cn(
                  "group flex w-full items-center justify-between gap-4 rounded-xl border border-polaria-t-20 bg-polaria-w-08 p-4 text-left",
                  "transition hover:border-polaria-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal",
                )}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-polaria-t-20 bg-polaria-t-08 text-polaria-teal">
                    <Warehouse className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <span
                      className={cn(
                        "inline-block rounded-md px-2 py-0.5 polaria-text-caption font-medium uppercase tracking-wide",
                        bodega.tipo === "interna"
                          ? "bg-polaria-t-08 text-polaria-teal"
                          : "bg-polaria-w-08 text-polaria-w-50",
                      )}
                    >
                      {bodega.tipo === "interna" ? "Interna" : "Externa"}
                    </span>
                    <p className="mt-1 truncate polaria-text-body-sm font-semibold text-polaria-w">
                      {bodega.nombre}
                    </p>
                    <p className="truncate polaria-text-caption text-polaria-w-50">
                      {bodega.codigo}
                    </p>
                  </div>
                </div>
                <ArrowRight
                  className="h-4 w-4 shrink-0 text-polaria-w-50 transition group-hover:translate-x-0.5 group-hover:text-polaria-teal"
                  aria-hidden
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
