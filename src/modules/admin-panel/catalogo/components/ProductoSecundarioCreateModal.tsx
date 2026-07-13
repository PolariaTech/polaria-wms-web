"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import {
  PolariaFormField,
  PolariaFormInput,
  PolariaFormSelect,
} from "@/components/shared/form/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { generateCodigoCuentaFromNombre } from "@/lib/utils/generate-codigo-cuenta";
import { listProveedoresAdmin } from "@/modules/admin-panel/proveedores/services/proveedores.service";
import { JefeBodegaModalSearchField } from "@/modules/jefe-bodega/components/modals/jefe-bodega-modal-ui";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import {
  CATALOGO_CATEGORIA_OPTIONS,
  CATALOGO_ESTADO_DEFAULT,
  CATALOGO_ESTADO_OPTIONS,
  CATALOGO_TIPO_SECUNDARIO,
  CATALOGO_UNIDAD_VISUALIZACION_DEFAULT,
  getCatalogoUnidadVisualizacionLabel,
  resolveCatalogoSelectOptions,
  resolveCatalogoUnidadMedida,
  createEmptyCatalogoMetadatos,
  type CatalogoProductoMetadatos,
} from "../constants/catalogo-producto";
import {
  createCatalogoProductoSecundario,
  listCatalogoProductosAdmin,
  type ProductoPrimarioOption,
} from "../services/productos-catalogo.service";
import {
  CATALOGO_BASE_PRIMARIO_LABEL,
  buildCatalogoConversionPreview,
  calcUnidadesPorKgPrimario,
  formatUnidadesPorKgPrimario,
  parseGramosPorUnidadInput,
  parseMermaPctInput,
} from "../constants/catalogo-conversion";
import { CatalogoFormTextarea } from "./CatalogoFormFields";
import { CatalogoPrimarioPickerModal } from "./CatalogoPrimarioPickerModal";
import { CatalogoUnidadVisualizacionPickerModal } from "./CatalogoUnidadVisualizacionPickerModal";

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
    unidadVisualizacion: CATALOGO_UNIDAD_VISUALIZACION_DEFAULT,
    idProductoPrimario: "",
    ...createEmptyCatalogoMetadatos(),
    tipo: CATALOGO_TIPO_SECUNDARIO,
    basePrimario: CATALOGO_BASE_PRIMARIO_LABEL,
    gramosPorUnidad: "200",
    mermaPct: "0",
    precio: "0",
  };
}

function mergeCategoriaOptions(
  fromCatalog: string[],
): { value: string; label: string }[] {
  const map = new Map<string, string>();
  for (const option of CATALOGO_CATEGORIA_OPTIONS) {
    map.set(option.value, option.label);
  }
  for (const categoria of fromCatalog) {
    const trimmed = categoria.trim();
    if (trimmed && trimmed !== "—") {
      map.set(trimmed, trimmed);
    }
  }
  return Array.from(map.entries())
    .sort((a, b) => a[1].localeCompare(b[1], "es"))
    .map(([value, label]) => ({ value, label }));
}

function formatPrimarioLabel(primario: ProductoPrimarioOption): string {
  if (primario.titulo) {
    return `${primario.titulo} (${primario.codigo})`;
  }
  return primario.codigo || primario.sku;
}

export function ProductoSecundarioCreateModal({
  open,
  onClose,
  onCreated,
}: ProductoSecundarioCreateModalProps) {
  const { codigoCuenta } = useCompany();
  const [form, setForm] = useState<ProductoSecundarioForm>(createInitialForm);
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

    setForm(createInitialForm());
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

    const gramos = parseGramosPorUnidadInput(form.gramosPorUnidad ?? "");
    if (gramos === null) {
      setError("Los gramos por unidad deben ser mayores a cero.");
      return;
    }

    const mermaPct = parseMermaPctInput(form.mermaPct ?? "0");
    if (mermaPct === null) {
      setError("El % de merma debe estar entre 0 y 100.");
      return;
    }

    const unidadesPorKg = calcUnidadesPorKgPrimario(gramos);
    if (unidadesPorKg === null) {
      setError("No se pudo calcular la relación de conversión.");
      return;
    }

    const primarioLabel = primarioSeleccionado
      ? formatPrimarioLabel(primarioSeleccionado)
      : "";

    const sku = generateCodigoCuentaFromNombre(titulo);
    if (!sku) {
      setError("No se pudo generar el SKU del producto secundario.");
      return;
    }

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
        unidadMedida: resolveCatalogoUnidadMedida(unidadVisualizacion),
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

        <PolariaFormSelect
          id="secundario-proveedor"
          label="Proveedor *"
          value={form.proveedor ?? ""}
          onChange={(event) => patch({ proveedor: event.target.value })}
          disabled={disabled}
          placeholder={isLoadingOptions ? "Cargando proveedores…" : "Seleccionar proveedor"}
          options={proveedorSelectOptions}
          compact
        />

        <PolariaFormSelect
          id="secundario-categoria"
          label="Categoría producto *"
          value={form.categoria ?? ""}
          onChange={(event) => patch({ categoria: event.target.value })}
          disabled={disabled}
          placeholder={isLoadingOptions ? "Cargando categorías…" : "Seleccionar categoría"}
          options={categoriaSelectOptions}
          compact
        />

        <PolariaFormSelect
          id="secundario-estado"
          label="Estado *"
          value={form.estado ?? CATALOGO_ESTADO_DEFAULT}
          onChange={(event) => patch({ estado: event.target.value })}
          disabled={disabled}
          options={CATALOGO_ESTADO_OPTIONS}
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

        <PolariaFormField
          id="secundario-unidad"
          label="Unidad de visualización *"
          compact
        >
          <div
            role="presentation"
            onClick={() => {
              if (!disabled) setUnidadPickerOpen(true);
            }}
            onKeyDown={(event) => {
              if (disabled) return;
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setUnidadPickerOpen(true);
              }
            }}
            className={disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}
          >
            <JefeBodegaModalSearchField
              id="secundario-unidad"
              value={unidadLabel}
              placeholder="Seleccionar unidad de visualización"
              ariaLabel="Unidad de visualización"
              onSearchClick={
                disabled ? undefined : () => setUnidadPickerOpen(true)
              }
            />
          </div>
        </PolariaFormField>

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
          <div className="mt-2 flex flex-col gap-3">
            <div>
              <p className="polaria-text-label text-polaria-w-50">Base primario</p>
              <p
                className="mt-1 rounded-lg border border-polaria-w-08 bg-polaria-bg px-3 py-2 polaria-text-body-sm text-polaria-w-50"
                aria-live="polite"
              >
                {CATALOGO_BASE_PRIMARIO_LABEL}
              </p>
            </div>

            <div>
              <PolariaFormInput
                id="secundario-gramos"
                label="G por unidad *"
                value={form.gramosPorUnidad ?? ""}
                onChange={(event) =>
                  patch({ gramosPorUnidad: event.target.value })
                }
                placeholder="200"
                disabled={disabled}
                compact
              />
              {conversionPreview ? (
                <p className="mt-1 polaria-text-caption text-polaria-teal">
                  ≈ {formatUnidadesPorKgPrimario(conversionPreview.unidadesPorKg)}{" "}
                  u/kg prim.
                </p>
              ) : null}
            </div>

            <PolariaFormInput
              id="secundario-merma"
              label="Merma (%)"
              value={form.mermaPct ?? ""}
              onChange={(event) => patch({ mermaPct: event.target.value })}
              placeholder="0"
              disabled={disabled}
              compact
              fieldClassName="max-w-[12rem]"
            />

            {conversionPreviewReady && conversionPreview ? (
              <div
                className="rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-3 py-3"
                role="status"
              >
                <p className="polaria-text-label text-polaria-w-50">
                  Vista previa de conversión
                </p>
                <dl className="mt-2 space-y-1.5 polaria-text-body-sm text-polaria-w">
                  <div className="flex flex-wrap justify-between gap-x-4 gap-y-1">
                    <dt className="text-polaria-w-50">Base primario</dt>
                    <dd>{CATALOGO_BASE_PRIMARIO_LABEL}</dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-x-4 gap-y-1">
                    <dt className="text-polaria-w-50">G por unidad</dt>
                    <dd>{conversionPreview.gramosPorUnidad} g</dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-x-4 gap-y-1">
                    <dt className="text-polaria-w-50">Unidades por kg primario</dt>
                    <dd className="font-medium text-polaria-teal">
                      ≈ {formatUnidadesPorKgPrimario(conversionPreview.unidadesPorKg)} u/kg
                    </dd>
                  </div>
                  {conversionPreview.unidadesPorKgConMerma !== null ? (
                    <div className="flex flex-wrap justify-between gap-x-4 gap-y-1">
                      <dt className="text-polaria-w-50">
                        Con merma ({conversionPreview.mermaPct}%)
                      </dt>
                      <dd className="font-medium text-polaria-teal">
                        ≈{" "}
                        {formatUnidadesPorKgPrimario(
                          conversionPreview.unidadesPorKgConMerma,
                        )}{" "}
                        u/kg
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </div>
            ) : null}
          </div>
        </fieldset>

        <PolariaFormField
          id="secundario-incluido-primario"
          label="Incluido primario *"
          compact
        >
          <div
            role="presentation"
            onClick={() => {
              if (!disabled) setPrimarioPickerOpen(true);
            }}
            onKeyDown={(event) => {
              if (disabled) return;
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setPrimarioPickerOpen(true);
              }
            }}
            className={disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}
          >
            <JefeBodegaModalSearchField
              id="secundario-incluido-primario"
              value={primarioLabel}
              placeholder="Seleccionar producto primario"
              ariaLabel="Incluido primario"
              onSearchClick={
                disabled ? undefined : () => setPrimarioPickerOpen(true)
              }
            />
          </div>
        </PolariaFormField>
      </div>
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
