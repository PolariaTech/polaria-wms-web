"use client";

import { Plus, Trash2 } from "lucide-react";
import {
  PolariaFormField,
  PolariaFormInput,
} from "@/components/shared/form/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { formatKgEs } from "@/lib/utils/decimal-es";
import type { CatalogoProductoListRow, ProveedorListRow } from "@/modules/admin-panel";
import { JefeBodegaModalSearchField } from "@/modules/jefe-bodega/components/modals/jefe-bodega-modal-ui";
import type { FormEvent } from "react";
import type { DraftLine } from "./orden-compra-create-modal.helpers";

export interface OrdenCompraCreateModalFormProps {
  open: boolean;
  handleClose: () => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  error: string | null;
  isSubmitting: boolean;
  fechaEntrega: string;
  setFechaEntrega: (value: string) => void;
  observaciones: string;
  setObservaciones: (value: string) => void;
  selectedProveedorLabel: string;
  isLoadingOptions: boolean;
  proveedores: ProveedorListRow[];
  disabled: boolean;
  setProveedorPickerOpen: (open: boolean) => void;
  selectedProductoLabel: string;
  productos: CatalogoProductoListRow[];
  setProductoPickerOpen: (open: boolean) => void;
  pickPesoKg: string;
  setPickPesoKg: (value: string) => void;
  addLine: () => void;
  lines: DraftLine[];
  removeLine: (index: number) => void;
  anyPickerOpen: boolean;
}

export function OrdenCompraCreateModalForm(props: OrdenCompraCreateModalFormProps) {
  const {
    open,
    handleClose,
    handleSubmit,
    error,
    isSubmitting,
    fechaEntrega,
    setFechaEntrega,
    observaciones,
    setObservaciones,
    selectedProveedorLabel,
    isLoadingOptions,
    proveedores,
    disabled,
    setProveedorPickerOpen,
    selectedProductoLabel,
    productos,
    setProductoPickerOpen,
    pickPesoKg,
    setPickPesoKg,
    addLine,
    lines,
    removeLine,
    anyPickerOpen,
  } = props;

  return (
    <PolariaFormModal
        open={open}
        onClose={handleClose}
        sectionLabel="Nueva orden"
        title="Nueva orden de compra"
        description="Orden manual · proveedor · productos"
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
        error={error}
        isSubmitting={isSubmitting}
        submitLabel="Guardar orden"
        compact
        size="md"
        closeOnEscape={!anyPickerOpen}
      >
        <PolariaFormField id="oc-proveedor" label="Proveedor" compact>
          <JefeBodegaModalSearchField
            id="oc-proveedor"
            value={selectedProveedorLabel}
            placeholder={
              isLoadingOptions
                ? "Cargando proveedores…"
                : proveedores.length === 0
                  ? "Sin proveedores"
                  : "Elegí proveedor…"
            }
            ariaLabel="Proveedor"
            onSearchClick={
              disabled || proveedores.length === 0
                ? undefined
                : () => setProveedorPickerOpen(true)
            }
          />
        </PolariaFormField>

        <PolariaFormInput
          id="oc-fecha"
          label="Fecha"
          type="date"
          value={fechaEntrega}
          onChange={(event) => setFechaEntrega(event.target.value)}
          disabled={disabled}
          compact
        />

        <PolariaFormInput
          id="oc-observaciones"
          label="Observación"
          value={observaciones}
          onChange={(event) => setObservaciones(event.target.value)}
          placeholder="Opcional"
          disabled={disabled}
          compact
          hint="Opcional."
        />

        {proveedores.length === 0 && !isLoadingOptions ? (
          <p className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-4 py-3 polaria-text-body-sm text-polaria-w-50">
            Registrá proveedores en administración antes de crear órdenes.
          </p>
        ) : null}

        {productos.length === 0 && !isLoadingOptions ? (
          <p className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-4 py-3 polaria-text-body-sm text-polaria-w-50">
            Tu administrador de cuenta debe registrar productos en el catálogo.
          </p>
        ) : null}

        <div className="rounded-xl border border-dashed border-polaria-t-20 bg-polaria-t-08 p-3">
          <p className="polaria-text-label mb-2 text-polaria-w-50">Productos</p>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="min-w-0 flex-1 sm:min-w-[200px]">
              <PolariaFormField id="oc-catalogo" label="Producto" compact>
                <JefeBodegaModalSearchField
                  id="oc-catalogo"
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
                      : () => setProductoPickerOpen(true)
                  }
                />
              </PolariaFormField>
            </div>

            <div className="w-full sm:w-32">
              <PolariaFormInput
                id="oc-peso-kg"
                label="Peso (kg)"
                type="text"
                inputMode="decimal"
                value={pickPesoKg}
                onChange={(event) => setPickPesoKg(event.target.value)}
                placeholder="Ej. 15,6"
                disabled={disabled || productos.length === 0}
                compact
              />
            </div>

            <button
              type="button"
              onClick={addLine}
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
                    onClick={() => removeLine(index)}
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
      </PolariaFormModal>
  );
}

