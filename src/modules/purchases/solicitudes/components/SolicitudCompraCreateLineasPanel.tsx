"use client";

import { Plus, Trash2 } from "lucide-react";
import {
  PolariaFormField,
  PolariaFormInput,
} from "@/components/shared/form/PolariaFormField";
import { formatKgEs } from "@/lib/utils/decimal-es";
import type { CatalogoProductoListRow } from "@/modules/admin-panel";
import { JefeBodegaModalSearchField } from "@/modules/jefe-bodega/components/modals/jefe-bodega-modal-ui";
import type { DraftLine } from "./solicitud-compra-create.helpers";

interface SolicitudCompraCreateLineasPanelProps {
  lines: DraftLine[];
  productos: CatalogoProductoListRow[];
  selectedProductoLabel: string;
  pickPesoKg: string;
  disabled: boolean;
  isLoadingOptions: boolean;
  onOpenProductoPicker: () => void;
  onChangePeso: (value: string) => void;
  onAddLine: () => void;
  onRemoveLine: (index: number) => void;
}

export function SolicitudCompraCreateLineasPanel({
  lines,
  productos,
  selectedProductoLabel,
  pickPesoKg,
  disabled,
  isLoadingOptions,
  onOpenProductoPicker,
  onChangePeso,
  onAddLine,
  onRemoveLine,
}: SolicitudCompraCreateLineasPanelProps) {
  return (
      <div className="rounded-xl border border-dashed border-polaria-t-20 bg-polaria-t-08 p-3">
        <p className="polaria-text-label mb-2 text-polaria-w-50">Líneas cat.</p>
  
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="min-w-0 flex-1 sm:min-w-[200px]">
            <PolariaFormField id="sol-catalogo" label="Producto" compact>
              <JefeBodegaModalSearchField
                id="sol-catalogo"
                value={selectedProductoLabel}
                placeholder={
                  isLoadingOptions
                    ? "Cargando productos…"
                    : productos.length === 0
                      ? "Sin productos"
                      : "Elegí producto…"
                }
                ariaLabel="Producto"
                onSearchClick={
                  disabled || productos.length === 0
                    ? undefined
                    : onOpenProductoPicker
                }
              />
            </PolariaFormField>
          </div>
  
          <div className="w-full sm:w-32">
            <PolariaFormInput
              id="sol-peso-kg"
              label="Peso (kg)"
              type="text"
              inputMode="decimal"
              value={pickPesoKg}
              onChange={(event) => onChangePeso(event.target.value)}
              placeholder="Ej. 15,6"
              disabled={disabled || productos.length === 0}
              compact
            />
          </div>
  
          <button
            type="button"
            onClick={onAddLine}
            disabled={disabled || productos.length === 0}
            className="inline-flex items-center justify-center gap-1 rounded-xl bg-polaria-teal px-4 py-2.5 polaria-text-body-sm font-semibold text-polaria-on-teal transition hover:opacity-90 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Agregar
          </button>
        </div>
  
        {lines.length === 0 ? (
          <p className="mt-3 text-center polaria-text-caption text-polaria-w-50">
            Sin líneas.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {lines.map((linea, index) => (
              <li
                key={`${linea.idProducto}-${index}`}
                className="flex items-center justify-between gap-2 rounded-lg border border-polaria-w-08 bg-polaria-bg px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-polaria-w">
                    {linea.titleSnapshot}
                  </p>
                  <p className="polaria-text-caption text-polaria-w-50">
                    {linea.skuSnapshot ? `SKU ${linea.skuSnapshot} · ` : null}
                    {formatKgEs(linea.pesoKg)} kg
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveLine(index)}
                  className="shrink-0 rounded-lg p-2 text-polaria-w-50 transition hover:bg-polaria-w-08"
                  aria-label="Quitar línea"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
  );
}
