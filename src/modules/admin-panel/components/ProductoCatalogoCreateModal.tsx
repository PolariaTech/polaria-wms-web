"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  PolariaFormInput,
  PolariaFormSelect,
} from "@/components/shared/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/PolariaFormModal";
import { DomainServiceError } from "@/lib/domain-service-error";
import { generateCodigoCuentaFromNombre } from "@/lib/generate-codigo-cuenta";
import { useCompany } from "@/providers/CompanyProvider";
import {
  CATALOGO_ESTADO_DEFAULT,
  CATALOGO_TIPO_PRIMARIO,
  CATALOGO_UNIDAD_VISUALIZACION_OPTIONS,
  createEmptyCatalogoMetadatos,
  type CatalogoProductoMetadatos,
} from "../constants/catalogo-producto";
import {
  createCatalogoProductoPrimario,
  listProductosPrimariosCatalogo,
  type ProductoPrimarioOption,
} from "../services/productos-catalogo.service";
import {
  CatalogoFormCheckbox,
  CatalogoFormTextarea,
} from "./CatalogoFormFields";

interface ProductoCatalogoCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

type ProductoCatalogoForm = CatalogoProductoMetadatos & {
  titulo: string;
  sku: string;
  unidadVisualizacion: string;
};

function createInitialForm(): ProductoCatalogoForm {
  return {
    titulo: "",
    sku: "",
    unidadVisualizacion: "cantidad",
    ...createEmptyCatalogoMetadatos(),
    tipo: CATALOGO_TIPO_PRIMARIO,
    estado: CATALOGO_ESTADO_DEFAULT,
  };
}

export function ProductoCatalogoCreateModal({
  open,
  onClose,
  onCreated,
}: ProductoCatalogoCreateModalProps) {
  const { codigoCuenta } = useCompany();
  const [form, setForm] = useState<ProductoCatalogoForm>(createInitialForm);
  const [primarios, setPrimarios] = useState<ProductoPrimarioOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    setForm(createInitialForm());
    setError(null);
    setIsSubmitting(false);

    if (!codigoCuenta) return;

    void listProductosPrimariosCatalogo(codigoCuenta)
      .then(setPrimarios)
      .catch(() => {
        setPrimarios([]);
      });
  }, [codigoCuenta, open]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  const patch = (partial: Partial<ProductoCatalogoForm>) => {
    setForm((current) => ({ ...current, ...partial }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!codigoCuenta) {
      setError("No se encontró la cuenta activa.");
      return;
    }

    const titulo = form.titulo.trim();
    const sku = form.sku.trim() || generateCodigoCuentaFromNombre(titulo);

    if (!titulo) {
      setError("El título es obligatorio.");
      return;
    }
    if (!form.descripcion?.trim()) {
      setError("La descripción es obligatoria.");
      return;
    }
    if (!form.proveedor?.trim()) {
      setError("El proveedor es obligatorio.");
      return;
    }
    if (!form.categoria?.trim()) {
      setError("La categoría es obligatoria.");
      return;
    }

    const primarioLabel =
      primarios.find((item) => item.idProducto === form.incluidoPrimarioId)
        ?.label ?? null;

    setIsSubmitting(true);

    try {
      const { titulo: _t, sku: _s, unidadVisualizacion, ...metadatos } = form;

      await createCatalogoProductoPrimario({
        codigoCuenta,
        sku,
        titulo,
        unidadMedida: unidadVisualizacion === "peso" ? "g" : "und",
        unidadVisualizacion,
        metadatos: {
          ...metadatos,
          titulo,
          tipo: CATALOGO_TIPO_PRIMARIO,
          incluidoPrimarioLabel: primarioLabel ?? undefined,
        },
      });
      onCreated();
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof DomainServiceError
          ? err.message
          : "No se pudo crear el producto.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PolariaFormModal
      open={open}
      onClose={handleClose}
      sectionLabel="Alta catálogo"
      title="Nuevo producto"
      compact
      className="max-w-6xl"
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      error={error}
      isSubmitting={isSubmitting}
      submitLabel="Crear producto"
    >
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
        <PolariaFormInput
          id="producto-tipo"
          label="Tipo *"
          value={form.tipo ?? CATALOGO_TIPO_PRIMARIO}
          readOnly
          disabled
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
        <PolariaFormInput
          id="producto-estado"
          label="Estado *"
          value={form.estado ?? CATALOGO_ESTADO_DEFAULT}
          placeholder="draft"
          onChange={(event) => patch({ estado: event.target.value })}
          disabled={isSubmitting}
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
        <PolariaFormInput
          id="producto-precio"
          label="Precio"
          value={form.precio ?? ""}
          placeholder="Ingresá precio"
          onChange={(event) => patch({ precio: event.target.value })}
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
          onChange={(event) =>
            patch({ cantidadInventario: event.target.value })
          }
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
          id="producto-unidad-visualizacion"
          label="Unidad de visualización *"
          hint="Etiqueta en pantalla."
          value={form.unidadVisualizacion}
          onChange={(event) =>
            patch({ unidadVisualizacion: event.target.value })
          }
          disabled={isSubmitting}
          options={CATALOGO_UNIDAD_VISUALIZACION_OPTIONS}
          compact
        />

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
          onChange={(event) =>
            patch({ servicioLogistica: event.target.value })
          }
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
          onChange={(event) =>
            patch({ urlImagenProducto: event.target.value })
          }
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
          onChange={(event) =>
            patch({ urlImagenVariante: event.target.value })
          }
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
      </div>
    </PolariaFormModal>
  );
}
