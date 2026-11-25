"use client";

import {
  PolariaFormInput,
  PolariaFormSelect,
} from "@/components/shared/form/PolariaFormField";
import {
  CATALOGO_ESTADO_DEFAULT,
  CATALOGO_ESTADO_OPTIONS,
  CATALOGO_TIPO_OPTIONS,
  CATALOGO_TIPO_PRIMARIO,
  CATALOGO_UNIDAD_MEDIDA_OPTIONS,
  CATALOGO_UNIDAD_VISUALIZACION_OPTIONS,
} from "../constants/catalogo-producto";
import type { ProductoPrimarioOption } from "../services/productos-catalogo.service";
import {
  CatalogoFormCheckbox,
  CatalogoFormTextarea,
} from "./CatalogoFormFields";
import type { ProductoCatalogoForm } from "./producto-catalogo-create-modal.types";
import { ProductoCatalogoCreateModalFieldsLogistica } from "./ProductoCatalogoCreateModalFieldsLogistica";
import { ProductoCatalogoCreateModalFieldsSeo } from "./ProductoCatalogoCreateModalFieldsSeo";

interface ProductoCatalogoCreateModalFieldsProps {
  form: ProductoCatalogoForm;
  patch: (partial: Partial<ProductoCatalogoForm>) => void;
  isSubmitting: boolean;
  primarios: ProductoPrimarioOption[];
}

export function ProductoCatalogoCreateModalFields({
  form,
  patch,
  isSubmitting,
  primarios,
}: ProductoCatalogoCreateModalFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <PolariaFormInput
        id="producto-titulo"
        label="Título *"
        value={form.titulo}
        placeholder="Ingresá título"
        onChange={(event) => patch({ titulo: event.target.value })}
        disabled={isSubmitting}
        autoFocus
        compact
      />
      <PolariaFormInput
        id="producto-slug"
        label="Identificador URL"
        value={form.slug ?? ""}
        placeholder="Ingresá identificador url"
        onChange={(event) => patch({ slug: event.target.value })}
        disabled={isSubmitting}
        compact
      />

      <CatalogoFormTextarea
        id="producto-descripcion"
        label="Descripción *"
        value={form.descripcion ?? ""}
        onChange={(event) => patch({ descripcion: event.target.value })}
        disabled={isSubmitting}
        fieldClassName="sm:col-span-2 lg:col-span-3"
      />

      <PolariaFormInput
        id="producto-proveedor"
        label="Proveedor *"
        value={form.proveedor ?? ""}
        placeholder="Ingresá proveedor"
        onChange={(event) => patch({ proveedor: event.target.value })}
        disabled={isSubmitting}
        compact
      />
      <PolariaFormInput
        id="producto-categoria"
        label="Categoría producto *"
        value={form.categoria ?? ""}
        placeholder="Ingresá categoría producto"
        onChange={(event) => patch({ categoria: event.target.value })}
        disabled={isSubmitting}
        compact
      />
      <PolariaFormSelect
        id="producto-tipo"
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
        id="producto-etiquetas"
        label="Etiquetas"
        value={form.etiquetas ?? ""}
        placeholder="Ingresá etiquetas"
        onChange={(event) => patch({ etiquetas: event.target.value })}
        disabled={isSubmitting}
        compact
      />
      <CatalogoFormCheckbox
        id="producto-publicado"
        label="Publicado en tienda online"
        checked={Boolean(form.publicadoTienda)}
        onChange={(checked) => patch({ publicadoTienda: checked })}
        disabled={isSubmitting}
      />
      <PolariaFormSelect
        id="producto-estado"
        label="Estado *"
        value={form.estado ?? CATALOGO_ESTADO_DEFAULT}
        onChange={(event) => patch({ estado: event.target.value })}
        disabled={isSubmitting}
        options={CATALOGO_ESTADO_OPTIONS}
        compact
      />

      <PolariaFormInput
        id="producto-sku"
        label="SKU"
        value={form.sku}
        placeholder="Ingresá sku"
        onChange={(event) => patch({ sku: event.target.value })}
        disabled={isSubmitting}
        compact
      />
      <PolariaFormInput
        id="producto-codigo-barras"
        label="Código de barras"
        value={form.codigoBarras ?? ""}
        placeholder="Ingresá código de barras"
        onChange={(event) => patch({ codigoBarras: event.target.value })}
        disabled={isSubmitting}
        compact
      />
      <PolariaFormInput
        id="producto-nombre-opcion-1"
        label="Nombre opción 1"
        value={form.nombreOpcion1 ?? ""}
        placeholder="Ingresá nombre opción 1"
        onChange={(event) => patch({ nombreOpcion1: event.target.value })}
        disabled={isSubmitting}
        compact
      />

      <PolariaFormInput
        id="producto-valor-opcion-1"
        label="Valor opción 1"
        value={form.valorOpcion1 ?? ""}
        placeholder="Ingresá valor opción 1"
        onChange={(event) => patch({ valorOpcion1: event.target.value })}
        disabled={isSubmitting}
        compact
      />
      <PolariaFormInput
        id="producto-vinculado-opcion-1"
        label="Vinculado a opción 1"
        value={form.vinculadoOpcion1 ?? ""}
        placeholder="Ingresá vinculado a opción 1"
        onChange={(event) => patch({ vinculadoOpcion1: event.target.value })}
        disabled={isSubmitting}
        compact
      />

      <CatalogoFormCheckbox
        id="producto-impuesto"
        label="Cobrar impuesto"
        checked={Boolean(form.cobrarImpuesto)}
        onChange={(checked) => patch({ cobrarImpuesto: checked })}
        disabled={isSubmitting}
      />
      <PolariaFormInput
        id="producto-rastreador"
        label="Rastreador inventario"
        value={form.rastreadorInventario ?? ""}
        placeholder="Ingresá rastreador inventario"
        onChange={(event) =>
          patch({ rastreadorInventario: event.target.value })
        }
        disabled={isSubmitting}
        compact
      />
      <PolariaFormInput
        id="producto-stock"
        label="Cantidad inventario"
        value={form.cantidadInventario ?? ""}
        placeholder="Ingresá cantidad inventario"
        onChange={(event) => patch({ cantidadInventario: event.target.value })}
        disabled={isSubmitting}
        compact
      />

      <CatalogoFormCheckbox
        id="producto-sin-stock"
        label="Continuar vendiendo sin stock"
        checked={Boolean(form.continuarSinStock)}
        onChange={(checked) => patch({ continuarSinStock: checked })}
        disabled={isSubmitting}
      />
      <PolariaFormInput
        id="producto-peso"
        label="Valor peso (g)"
        value={form.valorPesoG ?? ""}
        placeholder="Ingresá valor peso (g)"
        onChange={(event) => patch({ valorPesoG: event.target.value })}
        disabled={isSubmitting}
        compact
      />
      <PolariaFormSelect
        id="producto-unidad-medida"
        label="Unidad *"
        hint="Unidad de venta (kg, und, caja…)."
        value={form.unidadMedida}
        onChange={(event) => patch({ unidadMedida: event.target.value })}
        disabled={isSubmitting}
        options={[...CATALOGO_UNIDAD_MEDIDA_OPTIONS]}
        compact
      />
      <PolariaFormSelect
        id="producto-unidad-visualizacion"
        label="Unidad de visualización *"
        hint="Etiqueta en pantalla."
        value={form.unidadVisualizacion}
        onChange={(event) => patch({ unidadVisualizacion: event.target.value })}
        disabled={isSubmitting}
        options={CATALOGO_UNIDAD_VISUALIZACION_OPTIONS}
        compact
      />

      <ProductoCatalogoCreateModalFieldsLogistica
        form={form}
        patch={patch}
        isSubmitting={isSubmitting}
        primarios={primarios}
      />

      <ProductoCatalogoCreateModalFieldsSeo
        form={form}
        patch={patch}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
