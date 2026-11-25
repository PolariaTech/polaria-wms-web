"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { PolariaStatusLoading } from "@/components/shared/status/PolariaStatusLoading";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { generateCodigoCuentaFromNombre } from "@/lib/utils/generate-codigo-cuenta";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import {
  CATALOGO_ESTADO_DEFAULT,
  CATALOGO_TIPO_PRIMARIO,
  CATALOGO_TIPO_SECUNDARIO,
  CATALOGO_UNIDAD_MEDIDA_DEFAULT,
  createEmptyCatalogoMetadatos,
  parseCatalogoMetadatos,
} from "../constants/catalogo-producto";
import {
  getCatalogoProductoById,
  listProductosPrimariosCatalogo,
  updateCatalogoProducto,
  type ProductoPrimarioOption,
} from "../services/productos-catalogo.service";
import { createEditInitialForm, type ProductoCatalogoEditForm } from "./producto-catalogo-edit-modal.types";
import { ProductoCatalogoEditModalFields } from "./ProductoCatalogoEditModalFields";

interface ProductoCatalogoEditModalProps {
  open: boolean;
  idProducto: string | null;
  onClose: () => void;
  onUpdated: () => void;
}

export function ProductoCatalogoEditModalView({
  open,
  idProducto,
  onClose,
  onUpdated,
}: ProductoCatalogoEditModalProps) {
  const { codigoCuenta } = useCompany();
  const [form, setForm] = useState<ProductoCatalogoEditForm>(createEditInitialForm);
  const [primarios, setPrimarios] = useState<ProductoPrimarioOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open || !idProducto || !codigoCuenta) return;

    setError(null);
    setIsSubmitting(false);
    setIsLoading(true);
    setForm(createEditInitialForm());

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
          unidadMedida: row.unidad_medida?.trim() || CATALOGO_UNIDAD_MEDIDA_DEFAULT,
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

  const patch = (partial: Partial<ProductoCatalogoEditForm>) => {
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
    if (!form.unidadMedida?.trim()) {
      setError("La unidad es obligatoria.");
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
      const { titulo: _t, sku: _s, unidadVisualizacion, unidadMedida, ...metadatos } = form;

      await updateCatalogoProducto({
        codigoCuenta,
        idProducto,
        sku,
        titulo,
        unidadMedida: unidadMedida.trim() || CATALOGO_UNIDAD_MEDIDA_DEFAULT,
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
      size="2xl"
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      error={error}
      isSubmitting={isSubmitting || isLoading}
      submitLabel="Guardar cambios"
    >
      {isLoading ? (
        <PolariaStatusLoading
          embedded
          title="Cargando producto…"
          message="Estamos preparando el producto."
          className="py-4"
        />
      ) : (
        <ProductoCatalogoEditModalFields form={form} patch={patch} isSubmitting={isSubmitting} primarios={primarios} />
      )}
    </PolariaFormModal>
  );
}
