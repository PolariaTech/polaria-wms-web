"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  PolariaFormInput,
  PolariaFormSelect,
} from "@/components/shared/form/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { generateCodigoCuentaFromNombre } from "@/lib/utils/generate-codigo-cuenta";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import {
  CATALOGO_ESTADO_DEFAULT,
  CATALOGO_TIPO_SECUNDARIO,
  CATALOGO_UNIDAD_VISUALIZACION_OPTIONS,
  createEmptyCatalogoMetadatos,
  type CatalogoProductoMetadatos,
} from "../constants/catalogo-producto";
import {
  createCatalogoProductoSecundario,
  listProductosPrimariosCatalogo,
  type ProductoPrimarioOption,
} from "../services/productos-catalogo.service";
import { CatalogoFormTextarea } from "./CatalogoFormFields";

interface ProductoSecundarioCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

type ProductoSecundarioForm = CatalogoProductoMetadatos & {
  titulo: string;
  unidadVisualizacion: string;
  idProductoPrimario: string;
};

function createInitialForm(): ProductoSecundarioForm {
  return {
    titulo: "",
    unidadVisualizacion: "cantidad",
    idProductoPrimario: "",
    ...createEmptyCatalogoMetadatos(),
    tipo: CATALOGO_TIPO_SECUNDARIO,
    basePrimario: "1000 g",
    gramosPorUnidad: "200",
    mermaPct: "0",
    precio: "0",
  };
}

export function ProductoSecundarioCreateModal({
  open,
  onClose,
  onCreated,
}: ProductoSecundarioCreateModalProps) {
  const { codigoCuenta } = useCompany();
  const [form, setForm] = useState<ProductoSecundarioForm>(createInitialForm);
  const [primarios, setPrimarios] = useState<ProductoPrimarioOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  useEffect(() => {
    if (!open) return;

    setForm(createInitialForm());
    setError(null);
    setIsSubmitting(false);

    if (!codigoCuenta) return;

    setIsLoadingOptions(true);
    void listProductosPrimariosCatalogo(codigoCuenta)
      .then(setPrimarios)
      .catch(() => {
        setError("No se pudieron cargar los productos primarios.");
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

    const titulo = form.titulo.trim();
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
    if (!form.estado?.trim()) {
      setError("El estado es obligatorio.");
      return;
    }
    if (!form.precio?.trim()) {
      setError("El precio es obligatorio.");
      return;
    }
    if (!form.idProductoPrimario) {
      setError("Selecciona el producto primario incluido.");
      return;
    }

    const gramos = Number(form.gramosPorUnidad);
    if (!Number.isFinite(gramos) || gramos <= 0) {
      setError("Los gramos por unidad deben ser mayores a cero.");
      return;
    }

    const primarioLabel =
      primarios.find((item) => item.idProducto === form.idProductoPrimario)
        ?.label ?? "";

    const sku = generateCodigoCuentaFromNombre(titulo);
    if (!sku) {
      setError("No se pudo generar el SKU del producto secundario.");
      return;
    }

    const basePrimarioNum = Number(
      String(form.basePrimario ?? "").replace(/[^\d.]/g, ""),
    );

    setIsSubmitting(true);

    try {
      const {
        titulo: _t,
        unidadVisualizacion,
        idProductoPrimario,
        ...metadatos
      } = form;

      await createCatalogoProductoSecundario({
        codigoCuenta,
        sku,
        titulo,
        unidadMedida: unidadVisualizacion === "peso" ? "g" : "und",
        unidadVisualizacion,
        esPrimario: false,
        esSecundario: true,
        idProductoPrimario,
        reglaConversionCantidadPrimario:
          Number.isFinite(basePrimarioNum) && basePrimarioNum > 0
            ? basePrimarioNum
            : 1000,
        reglaConversionUnidadesSecundario: gramos,
        mermaPct: Number(form.mermaPct) || 0,
        metadatos: {
          ...metadatos,
          titulo,
          tipo: CATALOGO_TIPO_SECUNDARIO,
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

  return (
    <PolariaFormModal
      open={open}
      onClose={handleClose}
      sectionLabel="Alta secundario"
      title="Crear producto secundario"
      compact
      size="lg"
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      error={error}
      isSubmitting={isSubmitting}
      submitLabel="Crear producto secundario"
    >
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

        <PolariaFormInput
          id="secundario-proveedor"
          label="Proveedor *"
          value={form.proveedor ?? ""}
          onChange={(event) => patch({ proveedor: event.target.value })}
          disabled={disabled}
          compact
        />

        <PolariaFormInput
          id="secundario-categoria"
          label="Categoría producto *"
          value={form.categoria ?? ""}
          onChange={(event) => patch({ categoria: event.target.value })}
          disabled={disabled}
          compact
        />

        <PolariaFormInput
          id="secundario-estado"
          label="Estado *"
          value={form.estado ?? CATALOGO_ESTADO_DEFAULT}
          onChange={(event) => patch({ estado: event.target.value })}
          disabled={disabled}
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
          id="secundario-unidad"
          label="Unidad de visualización *"
          value={form.unidadVisualizacion}
          onChange={(event) =>
            patch({ unidadVisualizacion: event.target.value })
          }
          disabled={disabled}
          options={CATALOGO_UNIDAD_VISUALIZACION_OPTIONS}
          compact
        />

        <PolariaFormInput
          id="secundario-precio"
          label="Precio *"
          hint="Precio catálogo."
          value={form.precio ?? ""}
          onChange={(event) => patch({ precio: event.target.value })}
          disabled={disabled}
          compact
        />

        <fieldset className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 p-4">
          <legend className="px-1 polaria-text-label text-polaria-w-50">
            Conversión
          </legend>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <PolariaFormInput
              id="secundario-base-primario"
              label="Base primario"
              value={form.basePrimario ?? ""}
              onChange={(event) => patch({ basePrimario: event.target.value })}
              disabled={disabled}
              compact
            />
            <PolariaFormInput
              id="secundario-gramos"
              label="G por unidad *"
              value={form.gramosPorUnidad ?? ""}
              onChange={(event) =>
                patch({ gramosPorUnidad: event.target.value })
              }
              disabled={disabled}
              compact
            />
            <PolariaFormInput
              id="secundario-merma"
              label="Merma (%)"
              value={form.mermaPct ?? ""}
              onChange={(event) => patch({ mermaPct: event.target.value })}
              disabled={disabled}
              compact
            />
          </div>
        </fieldset>

        <PolariaFormSelect
          id="secundario-incluido-primario"
          label="Incluido primario *"
          value={form.idProductoPrimario}
          onChange={(event) =>
            patch({ idProductoPrimario: event.target.value })
          }
          disabled={disabled}
          placeholder="— Elegí —"
          options={primarios.map((item) => ({
            value: item.idProducto,
            label: item.label,
          }))}
          compact
        />
      </div>
    </PolariaFormModal>
  );
}
