"use client";

import {
  PolariaFormInput,
  PolariaFormSelect,
} from "@/components/shared/form/PolariaFormField";
import {
  CATALOGO_ESTADO_DEFAULT,
  CATALOGO_TIPO_OPTIONS,
  CATALOGO_TIPO_PRIMARIO,
  CATALOGO_UNIDAD_VISUALIZACION_OPTIONS,
  resolveCatalogoEstadoOptions,
  resolveCatalogoSelectOptions,
  CATALOGO_UNIDAD_MEDIDA_OPTIONS,
} from "../constants/catalogo-producto";
import type { ProductoPrimarioOption } from "../services/productos-catalogo.service";
import {
  CatalogoFormCheckbox,
  CatalogoFormTextarea,
} from "./CatalogoFormFields";
import type { ProductoCatalogoEditForm } from "./producto-catalogo-edit-modal.types";

interface Props {
  form: ProductoCatalogoEditForm;
  patch: (partial: Partial<ProductoCatalogoEditForm>) => void;
  isSubmitting: boolean;
  primarios: ProductoPrimarioOption[];
}

export function ProductoCatalogoEditModalFields({
  form,
  patch,
  isSubmitting,
  primarios,
}: Props) {
  const estadoOptions = resolveCatalogoEstadoOptions(form.estado);
  const unidadMedidaOptions = resolveCatalogoSelectOptions(
    CATALOGO_UNIDAD_MEDIDA_OPTIONS,
    form.unidadMedida,
  );

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <PolariaFormInput
        id="edit-producto-titulo"
        label="Título *"
        value={form.titulo}
        onChange={(event) => patch({ titulo: event.target.value })}
        disabled={isSubmitting}
        autoFocus
        compact
      />
      <PolariaFormInput
        id="edit-producto-slug"
        label="Identificador URL"
        value={form.slug ?? ""}
        onChange={(event) => patch({ slug: event.target.value })}
        disabled={isSubmitting}
        compact
      />

      <CatalogoFormTextarea
        id="edit-producto-descripcion"
        label="Descripción *"
        value={form.descripcion ?? ""}
        onChange={(event) => patch({ descripcion: event.target.value })}
        disabled={isSubmitting}
        fieldClassName="sm:col-span-2 lg:col-span-3"
      />

      <PolariaFormInput
        id="edit-producto-proveedor"
        label="Proveedor *"
        value={form.proveedor ?? ""}
        onChange={(event) => patch({ proveedor: event.target.value })}
        disabled={isSubmitting}
        compact
      />
      <PolariaFormInput
        id="edit-producto-categoria"
        label="Categoría producto *"
        value={form.categoria ?? ""}
        onChange={(event) => patch({ categoria: event.target.value })}
        disabled={isSubmitting}
        compact
      />
      <PolariaFormSelect
        id="edit-producto-tipo"
        label="Tipo *"
        value={form.tipo ?? CATALOGO_TIPO_PRIMARIO}
        onChange={(event) => patch({ tipo: event.target.value })}
        disabled={isSubmitting}
        options={CATALOGO_TIPO_OPTIONS.map((option) => ({
          value: option.value,
          label: option.label,
        }))}
        compact
      />

      <PolariaFormInput
        id="edit-producto-etiquetas"
        label="Etiquetas"
        value={form.etiquetas ?? ""}
        onChange={(event) => patch({ etiquetas: event.target.value })}
        disabled={isSubmitting}
        compact
      />
      <CatalogoFormCheckbox
        id="edit-producto-publicado"
        label="Publicado en tienda online"
        checked={Boolean(form.publicadoTienda)}
        onChange={(checked) => patch({ publicadoTienda: checked })}
        disabled={isSubmitting}
      />
      <PolariaFormSelect
        id="edit-producto-estado"
        label="Estado *"
        value={form.estado ?? CATALOGO_ESTADO_DEFAULT}
        onChange={(event) => patch({ estado: event.target.value })}
        disabled={isSubmitting}
        options={estadoOptions}
        compact
      />

      <PolariaFormInput
        id="edit-producto-sku"
        label="SKU"
        value={form.sku}
        onChange={(event) => patch({ sku: event.target.value })}
        disabled={isSubmitting}
        compact
      />
      <PolariaFormInput
        id="edit-producto-codigo-barras"
        label="Código de barras"
        value={form.codigoBarras ?? ""}
        onChange={(event) => patch({ codigoBarras: event.target.value })}
        disabled={isSubmitting}
        compact
      />

      <CatalogoFormCheckbox
        id="edit-producto-impuesto"
        label="Cobrar impuesto"
        checked={Boolean(form.cobrarImpuesto)}
        onChange={(checked) => patch({ cobrarImpuesto: checked })}
        disabled={isSubmitting}
      />
      <PolariaFormInput
        id="edit-producto-rastreador"
        label="Rastreador inventario"
        value={form.rastreadorInventario ?? ""}
        onChange={(event) =>
          patch({ rastreadorInventario: event.target.value })
        }
        disabled={isSubmitting}
        compact
      />
      <PolariaFormInput
        id="edit-producto-stock"
        label="Cantidad inventario"
        value={form.cantidadInventario ?? ""}
        onChange={(event) => patch({ cantidadInventario: event.target.value })}
        disabled={isSubmitting}
        compact
      />

      <PolariaFormSelect
        id="edit-producto-unidad-medida"
        label="Unidad *"
        hint="Unidad de venta (kg, und, caja…)."
        value={form.unidadMedida}
        onChange={(event) => patch({ unidadMedida: event.target.value })}
        disabled={isSubmitting}
        options={unidadMedidaOptions}
        compact
      />
      <PolariaFormSelect
        id="edit-producto-unidad-visualizacion"
        label="Unidad de visualización *"
        value={form.unidadVisualizacion}
        onChange={(event) => patch({ unidadVisualizacion: event.target.value })}
        disabled={isSubmitting}
        options={CATALOGO_UNIDAD_VISUALIZACION_OPTIONS}
        compact
      />

      <PolariaFormSelect
        id="edit-producto-incluido-primario"
        label="Incluido primario"
        hint="Requerido si el tipo es Secundario."
        value={form.incluidoPrimarioId ?? ""}
        onChange={(event) =>
          patch({ incluidoPrimarioId: event.target.value || undefined })
        }
        disabled={isSubmitting}
        placeholder="— Sin vínculo —"
        options={primarios.map((item) => ({
          value: item.idProducto,
          label: item.label,
        }))}
        compact
      />
    </div>
  );
}
