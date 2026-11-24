"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { generateCodigoCuentaFromNombre } from "@/lib/utils/generate-codigo-cuenta";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import {
  CATALOGO_TIPO_PRIMARIO,
  CATALOGO_TIPO_SECUNDARIO,
  CATALOGO_UNIDAD_MEDIDA_DEFAULT,
} from "../constants/catalogo-producto";
import {
  createCatalogoProductoPrimario,
  createCatalogoProductoSecundario,
  listProductosPrimariosCatalogo,
  type ProductoPrimarioOption,
} from "../services/productos-catalogo.service";
import { createInitialForm, type ProductoCatalogoForm } from "./producto-catalogo-create-modal.types";
import { ProductoCatalogoCreateModalFields } from "./ProductoCatalogoCreateModalFields";

interface ProductoCatalogoCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function ProductoCatalogoCreateModalView({
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
    const tipo = form.tipo?.trim() || CATALOGO_TIPO_PRIMARIO;
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

    const esSecundario = tipo.toLowerCase().includes("secund");
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
      const payload = {
        codigoCuenta,
        sku,
        titulo,
        unidadMedida: unidadMedida.trim() || CATALOGO_UNIDAD_MEDIDA_DEFAULT,
        unidadVisualizacion,
        metadatos: {
          ...metadatos,
          titulo,
          tipo: esSecundario ? CATALOGO_TIPO_SECUNDARIO : CATALOGO_TIPO_PRIMARIO,
          incluidoPrimarioLabel: primarioLabel ?? undefined,
        },
      };

      if (esSecundario) {
        await createCatalogoProductoSecundario({
          ...payload,
          idProductoPrimario: form.incluidoPrimarioId,
          esPrimario: false,
          esSecundario: true,
        });
      } else {
        await createCatalogoProductoPrimario(payload);
      }
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
      size="2xl"
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      error={error}
      isSubmitting={isSubmitting}
      submitLabel="Crear producto"
    >
      <ProductoCatalogoCreateModalFields form={form} patch={patch} isSubmitting={isSubmitting} primarios={primarios} />
    </PolariaFormModal>
  );
}
