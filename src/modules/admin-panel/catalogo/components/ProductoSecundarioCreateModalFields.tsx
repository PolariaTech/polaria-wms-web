"use client";

import {
  PolariaFormField,
  PolariaFormInput,
  PolariaFormSelect,
} from "@/components/shared/form/PolariaFormField";
import { JefeBodegaModalSearchField } from "@/modules/jefe-bodega/components/modals/jefe-bodega-modal-ui";
import {
  CATALOGO_ESTADO_DEFAULT,
  CATALOGO_ESTADO_OPTIONS,
  CATALOGO_TIPO_SECUNDARIO,
  CATALOGO_UNIDAD_MEDIDA_OPTIONS,
} from "../constants/catalogo-producto";
import type { buildCatalogoConversionPreview } from "../constants/catalogo-conversion";
import { CatalogoFormTextarea } from "./CatalogoFormFields";
import type { ProductoSecundarioForm } from "./producto-secundario-create-modal.types";
import { ProductoSecundarioConversionFieldset } from "./ProductoSecundarioConversionFieldset";

interface SelectOption {
  value: string;
  label: string;
}

interface ProductoSecundarioCreateModalFieldsProps {
  form: ProductoSecundarioForm;
  patch: (partial: Partial<ProductoSecundarioForm>) => void;
  disabled: boolean;
  isLoadingOptions: boolean;
  proveedorSelectOptions: SelectOption[];
  categoriaSelectOptions: SelectOption[];
  unidadLabel: string;
  primarioLabel: string;
  conversionPreview: ReturnType<typeof buildCatalogoConversionPreview>;
  conversionPreviewReady: boolean;
  onOpenUnidadPicker: () => void;
  onOpenPrimarioPicker: () => void;
}

export function ProductoSecundarioCreateModalFields({
  form,
  patch,
  disabled,
  isLoadingOptions,
  proveedorSelectOptions,
  categoriaSelectOptions,
  unidadLabel,
  primarioLabel,
  conversionPreview,
  conversionPreviewReady,
  onOpenUnidadPicker,
  onOpenPrimarioPicker,
}: ProductoSecundarioCreateModalFieldsProps) {
  return (
    <div className="flex flex-col gap-3">
      <PolariaFormInput
        id="secundario-titulo"
        label="Título *"
        value={form.titulo}
        onChange={(event) => patch({ titulo: event.target.value })}
        disabled={disabled}
        autoFocus
        compact
      />

      <CatalogoFormTextarea
        id="secundario-descripcion"
        label="Descripción *"
        value={form.descripcion ?? ""}
        onChange={(event) => patch({ descripcion: event.target.value })}
        disabled={disabled}
      />

      <PolariaFormSelect
        id="secundario-proveedor"
        label="Proveedor *"
        value={form.proveedor ?? ""}
        onChange={(event) => patch({ proveedor: event.target.value })}
        disabled={disabled}
        placeholder={
          isLoadingOptions ? "Cargando proveedores…" : "Seleccionar proveedor"
        }
        options={proveedorSelectOptions}
        compact
      />

      <PolariaFormSelect
        id="secundario-categoria"
        label="Categoría producto *"
        value={form.categoria ?? ""}
        onChange={(event) => patch({ categoria: event.target.value })}
        disabled={disabled}
        placeholder={
          isLoadingOptions ? "Cargando categorías…" : "Seleccionar categoría"
        }
        options={categoriaSelectOptions}
        compact
      />

      <PolariaFormSelect
        id="secundario-estado"
        label="Estado *"
        value={form.estado ?? CATALOGO_ESTADO_DEFAULT}
        onChange={(event) => patch({ estado: event.target.value })}
        disabled={disabled}
        options={CATALOGO_ESTADO_OPTIONS}
        compact
      />

      <PolariaFormInput
        id="secundario-tipo"
        label="Tipo *"
        value={CATALOGO_TIPO_SECUNDARIO}
        readOnly
        disabled
        compact
      />

      <PolariaFormSelect
        id="secundario-unidad-medida"
        label="Unidad *"
        hint="Unidad de venta (kg, und, caja…)."
        value={form.unidadMedida}
        onChange={(event) => patch({ unidadMedida: event.target.value })}
        disabled={disabled}
        options={[...CATALOGO_UNIDAD_MEDIDA_OPTIONS]}
        compact
      />

      <PolariaFormField
        id="secundario-unidad"
        label="Unidad de visualización *"
        compact
      >
        <div
          role="presentation"
          onClick={() => {
            if (!disabled) onOpenUnidadPicker();
          }}
          onKeyDown={(event) => {
            if (disabled) return;
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onOpenUnidadPicker();
            }
          }}
          className={
            disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
          }
        >
          <JefeBodegaModalSearchField
            id="secundario-unidad"
            value={unidadLabel}
            placeholder="Seleccionar unidad de visualización"
            ariaLabel="Unidad de visualización"
            onSearchClick={disabled ? undefined : () => onOpenUnidadPicker()}
          />
        </div>
      </PolariaFormField>

      <ProductoSecundarioConversionFieldset
        form={form}
        patch={patch}
        disabled={disabled}
        conversionPreview={conversionPreview}
        conversionPreviewReady={conversionPreviewReady}
      />

      <PolariaFormField
        id="secundario-incluido-primario"
        label="Incluido primario *"
        compact
      >
        <div
          role="presentation"
          onClick={() => {
            if (!disabled) onOpenPrimarioPicker();
          }}
          onKeyDown={(event) => {
            if (disabled) return;
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onOpenPrimarioPicker();
            }
          }}
          className={
            disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
          }
        >
          <JefeBodegaModalSearchField
            id="secundario-incluido-primario"
            value={primarioLabel}
            placeholder="Seleccionar producto primario"
            ariaLabel="Incluido primario"
            onSearchClick={disabled ? undefined : () => onOpenPrimarioPicker()}
          />
        </div>
      </PolariaFormField>
    </div>
  );
}
