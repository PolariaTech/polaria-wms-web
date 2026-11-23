"use client";

import {
  PolariaFormInput,
  PolariaFormSelect,
} from "@/components/shared/form/PolariaFormField";
import type { ProductoPrimarioOption } from "../services/productos-catalogo.service";
import { CatalogoFormCheckbox } from "./CatalogoFormFields";
import type { ProductoCatalogoForm } from "./producto-catalogo-create-modal.types";

interface ProductoCatalogoCreateModalFieldsLogisticaProps {
  form: ProductoCatalogoForm;
  patch: (partial: Partial<ProductoCatalogoForm>) => void;
  isSubmitting: boolean;
  primarios: ProductoPrimarioOption[];
}

/** Incluido primario, logística e imágenes (hijos directos del grid del formulario). */
export function ProductoCatalogoCreateModalFieldsLogistica({
  form,
  patch,
  isSubmitting,
  primarios,
}: ProductoCatalogoCreateModalFieldsLogisticaProps) {
  return (
    <>
      <PolariaFormSelect
        id="producto-incluido-primario"
        label="Incluido primario"
        hint="Derivado opcional."
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
      <CatalogoFormCheckbox
        id="producto-requiere-envio"
        label="Requiere envío"
        checked={Boolean(form.requiereEnvio)}
        onChange={(checked) => patch({ requiereEnvio: checked })}
        disabled={isSubmitting}
      />
      <PolariaFormInput
        id="producto-servicio-logistica"
        label="Servicio logística"
        value={form.servicioLogistica ?? ""}
        placeholder="Ingresá servicio logística"
        onChange={(event) => patch({ servicioLogistica: event.target.value })}
        disabled={isSubmitting}
        compact
      />

      <CatalogoFormCheckbox
        id="producto-internacional"
        label="Incluido internacional"
        checked={Boolean(form.incluidoInternacional)}
        onChange={(checked) => patch({ incluidoInternacional: checked })}
        disabled={isSubmitting}
      />
      <PolariaFormInput
        id="producto-url-imagen"
        label="URL imagen producto"
        value={form.urlImagenProducto ?? ""}
        placeholder="Ingresá url imagen producto"
        onChange={(event) => patch({ urlImagenProducto: event.target.value })}
        disabled={isSubmitting}
        compact
      />
      <PolariaFormInput
        id="producto-posicion-imagen"
        label="Posición imagen"
        value={form.posicionImagen ?? ""}
        placeholder="Ingresá posición imagen"
        onChange={(event) => patch({ posicionImagen: event.target.value })}
        disabled={isSubmitting}
        compact
      />

      <PolariaFormInput
        id="producto-alt-imagen"
        label="Texto alt imagen"
        value={form.textoAltImagen ?? ""}
        placeholder="Ingresá texto alt imagen"
        onChange={(event) => patch({ textoAltImagen: event.target.value })}
        disabled={isSubmitting}
        compact
      />
      <PolariaFormInput
        id="producto-url-variante"
        label="URL imagen variante"
        value={form.urlImagenVariante ?? ""}
        placeholder="Ingresá url imagen variante"
        onChange={(event) => patch({ urlImagenVariante: event.target.value })}
        disabled={isSubmitting}
        compact
      />
      <CatalogoFormCheckbox
        id="producto-tarjeta-regalo"
        label="Tarjeta regalo"
        checked={Boolean(form.tarjetaRegalo)}
        onChange={(checked) => patch({ tarjetaRegalo: checked })}
        disabled={isSubmitting}
      />
    </>
  );
}
