"use client";

import { Download } from "lucide-react";
import { PolariaFormInput } from "@/components/shared/form/PolariaFormField";
import { CompradorPreciosGruposSection } from "./comprador-precios-gestion-modal.grupos-section";
import type { CompradorPreciosProductoOption } from "./comprador-precios-gestion-modal.types";
import {
  ACTION_BUTTON_PRIMARY_CLASS,
  ACTION_BUTTON_SECONDARY_CLASS,
  toggleValue,
} from "./comprador-precios-gestion-modal.utils";

interface CompradorPreciosStepExportarProps {
  isBusy: boolean;
  isExporting: boolean;
  exportDisabled: boolean;
  catalogoGrupos: readonly string[];
  productos: readonly CompradorPreciosProductoOption[];
  productoIds: readonly string[];
  selectedGrupos: string[];
  selectedProductos: string[];
  fechaInicio: string;
  fechaFin: string;
  fechaRangoInvalido: boolean;
  onGruposChange: (next: string[]) => void;
  onProductosChange: (updater: (prev: string[]) => string[]) => void;
  onFechaInicioChange: (value: string) => void;
  onFechaFinChange: (value: string) => void;
  onBack: () => void;
  onConfirm: () => void;
}

export function CompradorPreciosStepExportar({
  isBusy,
  isExporting,
  exportDisabled,
  catalogoGrupos,
  productos,
  productoIds,
  selectedGrupos,
  selectedProductos,
  fechaInicio,
  fechaFin,
  fechaRangoInvalido,
  onGruposChange,
  onProductosChange,
  onFechaInicioChange,
  onFechaFinChange,
  onBack,
  onConfirm,
}: CompradorPreciosStepExportarProps) {
  const allProductosSelected =
    productos.length > 0 && selectedProductos.length === productos.length;

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 p-3">
        <h3 className="mb-2 polaria-text-label uppercase tracking-wide text-polaria-teal">
          Periodo
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <PolariaFormInput
            id="precios-export-fecha-inicio"
            label="Fecha inicio"
            type="date"
            compact
            value={fechaInicio}
            disabled={isBusy}
            onChange={(event) => onFechaInicioChange(event.target.value)}
          />
          <PolariaFormInput
            id="precios-export-fecha-fin"
            label="Fecha final"
            type="date"
            compact
            value={fechaFin}
            disabled={isBusy}
            onChange={(event) => onFechaFinChange(event.target.value)}
          />
        </div>
        {fechaRangoInvalido ? (
          <p className="mt-2 polaria-text-body-sm text-polaria-w-50">
            La fecha inicio no puede ser posterior a la fecha final.
          </p>
        ) : null}
      </section>

      <CompradorPreciosGruposSection
        catalogoGrupos={catalogoGrupos}
        selected={selectedGrupos}
        onChange={onGruposChange}
        disabled={isBusy}
      />

      <section className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="polaria-text-label uppercase tracking-wide text-polaria-teal">
            Producto más vendido
          </h3>
          <button
            type="button"
            disabled={isBusy || productos.length === 0}
            onClick={() =>
              onProductosChange(() =>
                allProductosSelected ? [] : [...productoIds],
              )
            }
            className="polaria-text-body-sm text-polaria-teal hover:underline disabled:opacity-60"
          >
            {allProductosSelected ? "Quitar todos" : "Seleccionar todos"}
          </button>
        </div>
        {productos.length === 0 ? (
          <p className="polaria-text-body-sm text-polaria-w-50">
            No hay productos más vendidos cargados para esta cuenta.
          </p>
        ) : (
          <div className="max-h-48 space-y-1 overflow-y-auto pr-1">
            {productos.map((producto) => (
              <label
                key={producto.idProducto}
                className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 polaria-text-body-sm text-polaria-w hover:bg-polaria-t-08"
              >
                <input
                  type="checkbox"
                  checked={selectedProductos.includes(producto.idProducto)}
                  disabled={isBusy}
                  onChange={() =>
                    onProductosChange((prev) =>
                      toggleValue(prev, producto.idProducto),
                    )
                  }
                  className="mt-0.5 h-4 w-4 shrink-0 accent-polaria-teal"
                />
                <span className="min-w-0">
                  <span className="font-medium text-polaria-teal">
                    {producto.codigo}
                  </span>
                  <span className="text-polaria-w-50"> — </span>
                  <span className="break-words">{producto.nombre}</span>
                </span>
              </label>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isBusy}
          className={ACTION_BUTTON_SECONDARY_CLASS}
        >
          Volver
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={
            isBusy ||
            exportDisabled ||
            selectedGrupos.length === 0 ||
            selectedProductos.length === 0 ||
            !fechaInicio ||
            !fechaFin ||
            fechaRangoInvalido
          }
          className={ACTION_BUTTON_PRIMARY_CLASS}
        >
          <Download className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          {isExporting ? "Exportando…" : "Descargar Excel"}
        </button>
      </div>
    </div>
  );
}
