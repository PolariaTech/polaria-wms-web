"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { listProveedoresAdmin } from "@/modules/admin-panel/proveedores/services/proveedores.service";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import {
  CATALOGO_CATEGORIA_OPTIONS,
  CATALOGO_TIPO_SECUNDARIO,
  CATALOGO_UNIDAD_MEDIDA_DEFAULT,
  getCatalogoUnidadVisualizacionLabel,
  resolveCatalogoSelectOptions,
} from "../constants/catalogo-producto";
import {
  createCatalogoProductoSecundario,
  listCatalogoProductosAdmin,
  type ProductoPrimarioOption,
} from "../services/productos-catalogo.service";
import {
  CATALOGO_BASE_PRIMARIO_LABEL,
  buildCatalogoConversionPreview,
  parseMermaPctInput,
} from "../constants/catalogo-conversion";
import { mergeCategoriaOptions, formatPrimarioLabel } from "./producto-secundario-create-modal.helpers";
import { createSecundarioInitialForm, type ProductoSecundarioForm } from "./producto-secundario-create-modal.types";
import { validateProductoSecundarioForm } from "./producto-secundario-create-modal.validate";
import { ProductoSecundarioCreateModalFields } from "./ProductoSecundarioCreateModalFields";
import { CatalogoPrimarioPickerModal } from "./CatalogoPrimarioPickerModal";
import { CatalogoUnidadVisualizacionPickerModal } from "./CatalogoUnidadVisualizacionPickerModal";

interface ProductoSecundarioCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function ProductoSecundarioCreateModalView({
  open,
  onClose,
  onCreated,
}: ProductoSecundarioCreateModalProps) {
  const { codigoCuenta } = useCompany();
  const [form, setForm] = useState<ProductoSecundarioForm>(createSecundarioInitialForm);
  const [primarioSeleccionado, setPrimarioSeleccionado] =
    useState<ProductoPrimarioOption | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [primarioPickerOpen, setPrimarioPickerOpen] = useState(false);
  const [unidadPickerOpen, setUnidadPickerOpen] = useState(false);
  const [proveedorOptions, setProveedorOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [categoriaOptions, setCategoriaOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  useEffect(() => {
    if (!open) return;

    setForm(createSecundarioInitialForm());
    setPrimarioSeleccionado(null);
    setError(null);
    setIsSubmitting(false);
    setPrimarioPickerOpen(false);
    setUnidadPickerOpen(false);

    if (!codigoCuenta) {
      setProveedorOptions([]);
      setCategoriaOptions(CATALOGO_CATEGORIA_OPTIONS.map((option) => ({ ...option })));
      return;
    }

    setIsLoadingOptions(true);

    void Promise.all([
      listProveedoresAdmin({ codigoCuenta }),
      listCatalogoProductosAdmin({ codigoCuenta }),
    ])
      .then(([proveedores, productos]) => {
        setProveedorOptions(
          proveedores.map((row) => ({
            value: row.proveedor,
            label: row.proveedor,
          })),
        );
        setCategoriaOptions(
          mergeCategoriaOptions(productos.map((row) => row.categoria)),
        );
      })
      .catch(() => {
        setProveedorOptions([]);
        setCategoriaOptions(CATALOGO_CATEGORIA_OPTIONS.map((option) => ({ ...option })));
      })
      .finally(() => {
        setIsLoadingOptions(false);
      });
  }, [codigoCuenta, open]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  const patch = (partial: Partial<ProductoSecundarioForm>) => {
    setForm((current) => ({ ...current, ...partial }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!codigoCuenta) {
      setError("No se encontró la cuenta activa.");
      return;
    }

    const validation = validateProductoSecundarioForm(form);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }
    const { titulo, sku, gramos, mermaPct, unidadesPorKg } = validation;

    const primarioLabel = primarioSeleccionado
      ? formatPrimarioLabel(primarioSeleccionado)
      : "";

    setIsSubmitting(true);

    try {
      const {
        titulo: _t,
        unidadVisualizacion,
        unidadMedida,
        idProductoPrimario,
        ...metadatos
      } = form;

      await createCatalogoProductoSecundario({
        codigoCuenta,
        sku,
        titulo,
        unidadMedida: unidadMedida.trim() || CATALOGO_UNIDAD_MEDIDA_DEFAULT,
        unidadVisualizacion,
        esPrimario: false,
        esSecundario: true,
        idProductoPrimario,
        reglaConversionCantidadPrimario: 1,
        reglaConversionUnidadesSecundario: unidadesPorKg,
        mermaPct,
        metadatos: {
          ...metadatos,
          titulo,
          tipo: CATALOGO_TIPO_SECUNDARIO,
          basePrimario: CATALOGO_BASE_PRIMARIO_LABEL,
          gramosPorUnidad: String(gramos),
          mermaPct: String(mermaPct),
          incluidoPrimarioId: idProductoPrimario,
          incluidoPrimarioLabel: primarioLabel,
        },
      });
      onCreated();
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof DomainServiceError
          ? err.message
          : "No se pudo crear el producto secundario.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const disabled = isSubmitting || isLoadingOptions;
  const primarioLabel = primarioSeleccionado
    ? formatPrimarioLabel(primarioSeleccionado)
    : "";
  const unidadLabel = getCatalogoUnidadVisualizacionLabel(form.unidadVisualizacion);
  const proveedorSelectOptions = useMemo(
    () => resolveCatalogoSelectOptions(proveedorOptions, form.proveedor),
    [form.proveedor, proveedorOptions],
  );
  const categoriaSelectOptions = useMemo(
    () => resolveCatalogoSelectOptions(categoriaOptions, form.categoria),
    [categoriaOptions, form.categoria],
  );
  const nestedPickerOpen = primarioPickerOpen || unidadPickerOpen;
  const conversionPreview = useMemo(
    () =>
      buildCatalogoConversionPreview(
        form.gramosPorUnidad ?? "",
        form.mermaPct ?? "0",
      ),
    [form.gramosPorUnidad, form.mermaPct],
  );
  const conversionPreviewReady =
    conversionPreview !== null &&
    parseMermaPctInput(form.mermaPct ?? "0") !== null;

  return (
    <>
    <PolariaFormModal
      open={open}
      onClose={handleClose}
      sectionLabel="Alta secundario"
      title="Crear producto secundario"
      compact
      size="lg"
      closeOnEscape={!nestedPickerOpen}
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      error={error}
      isSubmitting={isSubmitting}
      submitLabel="Crear producto secundario"
    >
      <ProductoSecundarioCreateModalFields
        form={form}
        patch={patch}
        disabled={disabled}
        isLoadingOptions={isLoadingOptions}
        proveedorSelectOptions={proveedorSelectOptions}
        categoriaSelectOptions={categoriaSelectOptions}
        unidadLabel={unidadLabel}
        primarioLabel={primarioLabel}
        conversionPreview={conversionPreview}
        conversionPreviewReady={conversionPreviewReady}
        onOpenUnidadPicker={() => setUnidadPickerOpen(true)}
        onOpenPrimarioPicker={() => setPrimarioPickerOpen(true)}
      />
    </PolariaFormModal>

    {typeof document !== "undefined"
      ? createPortal(
          <>
          <CatalogoPrimarioPickerModal
            open={primarioPickerOpen}
            onClose={() => setPrimarioPickerOpen(false)}
            codigoCuenta={codigoCuenta}
            selectedId={form.idProductoPrimario || null}
            onSelect={(primario) => {
              setPrimarioSeleccionado(primario);
              patch({ idProductoPrimario: primario.idProducto });
            }}
          />
          <CatalogoUnidadVisualizacionPickerModal
            open={unidadPickerOpen}
            onClose={() => setUnidadPickerOpen(false)}
            selectedValue={form.unidadVisualizacion || null}
            onSelect={(unidad) => {
              patch({ unidadVisualizacion: unidad.value });
            }}
          />
          </>,
          document.body,
        )
      : null}
    </>
  );
}
