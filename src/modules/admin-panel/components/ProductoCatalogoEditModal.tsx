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
  CATALOGO_TIPO_OPTIONS,
  CATALOGO_TIPO_PRIMARIO,
  CATALOGO_TIPO_SECUNDARIO,
  CATALOGO_UNIDAD_VISUALIZACION_OPTIONS,
  createEmptyCatalogoMetadatos,
  parseCatalogoMetadatos,
  type CatalogoProductoMetadatos,
} from "../constants/catalogo-producto";
import {
  getCatalogoProductoById,
  listProductosPrimariosCatalogo,
  updateCatalogoProducto,
  type ProductoPrimarioOption,
} from "../services/productos-catalogo.service";
import {
  CatalogoFormCheckbox,
  CatalogoFormTextarea,
} from "./CatalogoFormFields";

interface ProductoCatalogoEditModalProps {
  open: boolean;
  idProducto: string | null;
  onClose: () => void;
  onUpdated: () => void;
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

export function ProductoCatalogoEditModal({
  open,
  idProducto,
  onClose,
  onUpdated,
}: ProductoCatalogoEditModalProps) {
  const { codigoCuenta } = useCompany();
  const [form, setForm] = useState<ProductoCatalogoForm>(createInitialForm);
  const [primarios, setPrimarios] = useState<ProductoPrimarioOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open || !idProducto || !codigoCuenta) return;

    setError(null);
    setIsSubmitting(false);
    setIsLoading(true);
    setForm(createInitialForm());

    void Promise.all([
      getCatalogoProductoById(codigoCuenta, idProducto),
      listProductosPrimariosCatalogo(codigoCuenta),
    ])
      .then(([row, primarioOptions]) => {
        setPrimarios(primarioOptions);

        if (!row) {
          setError("No se encontró el producto.");
          return;
        }

        const meta = parseCatalogoMetadatos(row.metadatos_catalogo);
        const tipo = meta.tipo?.trim()
          ? meta.tipo
          : row.es_secundario
            ? CATALOGO_TIPO_SECUNDARIO
            : CATALOGO_TIPO_PRIMARIO;

        setForm({
          titulo: meta.titulo?.trim() || row.descripcion.trim(),
          sku: row.sku,
          unidadVisualizacion: row.unidad_visualizacion || "cantidad",
          ...createEmptyCatalogoMetadatos(),
          ...meta,
          tipo,
          estado: meta.estado ?? CATALOGO_ESTADO_DEFAULT,
        });
      })
      .catch(() => {
        setError("No se pudo cargar el producto.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [codigoCuenta, idProducto, open]);

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

    if (!codigoCuenta || !idProducto) {
      setError("No se encontró la cuenta o el producto.");
      return;
    }

    const titulo = form.titulo.trim();
    const sku = form.sku.trim() || generateCodigoCuentaFromNombre(titulo);
    const tipo = form.tipo?.trim() || CATALOGO_TIPO_PRIMARIO;
    const esSecundario = tipo.toLowerCase().includes("secund");

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
    if (!tipo) {
      setError("El tipo es obligatorio.");
      return;
    }
    if (!form.estado?.trim()) {
      setError("El estado es obligatorio.");
      return;
    }
    if (!form.precio?.trim()) {
      setError("El precio es obligatorio.");
      return;
    }
    if (esSecundario && !form.incluidoPrimarioId) {
      setError("Selecciona el producto primario incluido.");
      return;
    }

    const primarioLabel =
      primarios.find((item) => item.idProducto === form.incluidoPrimarioId)
        ?.label ?? null;

    setIsSubmitting(true);

    try {
      const { titulo: _t, sku: _s, unidadVisualizacion, ...metadatos } = form;

      await updateCatalogoProducto({
        codigoCuenta,
        idProducto,
        sku,
        titulo,
        unidadMedida: unidadVisualizacion === "peso" ? "g" : "und",
        unidadVisualizacion,
        esPrimario: !esSecundario,
        esSecundario,
        metadatos: {
          ...metadatos,
          titulo,
          tipo,
          incluidoPrimarioLabel: primarioLabel ?? undefined,
        },
      });
      onUpdated();
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof DomainServiceError
          ? err.message
          : "No se pudo actualizar el producto.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PolariaFormModal
      open={open}
      onClose={handleClose}
      sectionLabel="Edición catálogo"
      title="Editar producto"
      compact
      className="max-w-6xl"
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      error={error}
      isSubmitting={isSubmitting || isLoading}
      submitLabel="Guardar cambios"
    >
      {isLoading ? (
        <p className="polaria-text-body-sm text-polaria-w-50">Cargando producto…</p>
      ) : (
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
          <PolariaFormInput
            id="edit-producto-estado"
            label="Estado *"
            value={form.estado ?? CATALOGO_ESTADO_DEFAULT}
            onChange={(event) => patch({ estado: event.target.value })}
            disabled={isSubmitting}
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
          <PolariaFormInput
            id="edit-producto-precio"
            label="Precio *"
            value={form.precio ?? ""}
            onChange={(event) => patch({ precio: event.target.value })}
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
            onChange={(event) =>
              patch({ cantidadInventario: event.target.value })
            }
            disabled={isSubmitting}
            compact
          />

          <PolariaFormSelect
            id="edit-producto-unidad-visualizacion"
            label="Unidad de visualización *"
            value={form.unidadVisualizacion}
            onChange={(event) =>
              patch({ unidadVisualizacion: event.target.value })
            }
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
      )}
    </PolariaFormModal>
  );
}
