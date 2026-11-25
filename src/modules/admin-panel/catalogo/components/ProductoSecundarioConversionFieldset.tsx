"use client";

import { PolariaFormInput } from "@/components/shared/form/PolariaFormField";
import {
  CATALOGO_BASE_PRIMARIO_LABEL,
  buildCatalogoConversionPreview,
  formatUnidadesPorKgPrimario,
} from "../constants/catalogo-conversion";
import type { ProductoSecundarioForm } from "./producto-secundario-create-modal.types";

interface Props {
  form: ProductoSecundarioForm;
  patch: (partial: Partial<ProductoSecundarioForm>) => void;
  disabled: boolean;
  conversionPreview: ReturnType<typeof buildCatalogoConversionPreview>;
  conversionPreviewReady: boolean;
}

export function ProductoSecundarioConversionFieldset({
  form,
  patch,
  disabled,
  conversionPreview,
  conversionPreviewReady,
}: Props) {
  return (
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
            onChange={(event) => patch({ gramosPorUnidad: event.target.value })}
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
                  ≈{" "}
                  {formatUnidadesPorKgPrimario(conversionPreview.unidadesPorKg)}{" "}
                  u/kg
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
  );
}
