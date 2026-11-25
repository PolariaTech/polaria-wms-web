"use client";

import { PolariaFormInput } from "@/components/shared/form/PolariaFormField";
import { CatalogoFormTextarea } from "./CatalogoFormFields";
import type { ProductoCatalogoForm } from "./producto-catalogo-create-modal.types";

interface ProductoCatalogoCreateModalFieldsSeoProps {
  form: ProductoCatalogoForm;
  patch: (partial: Partial<ProductoCatalogoForm>) => void;
  isSubmitting: boolean;
}

export function ProductoCatalogoCreateModalFieldsSeo({
  form,
  patch,
  isSubmitting,
}: ProductoCatalogoCreateModalFieldsSeoProps) {
  return (
    <>
      <PolariaFormInput
        id="producto-titulo-seo"
        label="Título SEO"
        value={form.tituloSeo ?? ""}
        placeholder="Ingresá título seo"
        onChange={(event) => patch({ tituloSeo: event.target.value })}
        disabled={isSubmitting}
        compact
        fieldClassName="sm:col-span-2 lg:col-span-3"
      />

      <CatalogoFormTextarea
        id="producto-descripcion-seo"
        label="Descripción SEO"
        value={form.descripcionSeo ?? ""}
        placeholder="Ingresá descripción seo"
        onChange={(event) => patch({ descripcionSeo: event.target.value })}
        disabled={isSubmitting}
        fieldClassName="sm:col-span-2 lg:col-span-3"
      />

      <PolariaFormInput
        id="producto-google-shopping"
        label="Google shopping categoría producto"
        value={form.googleShoppingCategoria ?? ""}
        placeholder="Ingresá google shopping categoría"
        onChange={(event) =>
          patch({ googleShoppingCategoria: event.target.value })
        }
        disabled={isSubmitting}
        compact
        fieldClassName="sm:col-span-2 lg:col-span-3"
      />

      <CatalogoFormTextarea
        id="producto-metacampos"
        label="Metacampos"
        value={form.metacampos ?? ""}
        onChange={(event) => patch({ metacampos: event.target.value })}
        disabled={isSubmitting}
        fieldClassName="sm:col-span-2 lg:col-span-3"
      />
    </>
  );
}
