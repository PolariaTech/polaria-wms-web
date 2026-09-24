"use client";

import { Link2 } from "lucide-react";
import { PolariaFormInput } from "@/components/shared/form/PolariaFormField";
import { cn } from "@/lib/utils/cn";

export interface CuentaReporteEmbedFormValues {
  descripcion: string;
  embedUrl: string;
  estaActivo: boolean;
}

interface CuentaReporteEmbedFormFieldsProps {
  idPrefix: string;
  values: CuentaReporteEmbedFormValues;
  disabled?: boolean;
  showEstado?: boolean;
  onChange: (patch: Partial<CuentaReporteEmbedFormValues>) => void;
}

function urlHost(raw: string): string | null {
  try {
    return new URL(raw.trim()).host;
  } catch {
    return null;
  }
}

export function CuentaReporteEmbedFormFields({
  idPrefix,
  values,
  disabled = false,
  showEstado = false,
  onChange,
}: CuentaReporteEmbedFormFieldsProps) {
  const host = urlHost(values.embedUrl);

  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-3 rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-4 py-3">
        <span className="polaria-teal-glow flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-polaria-t-20 bg-polaria-t-08 text-polaria-teal">
          <Link2 className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="truncate polaria-text-body-sm font-medium text-polaria-w">
            {values.descripcion.trim() || "Nuevo reporte"}
          </p>
          <p className="truncate polaria-text-caption text-polaria-w-50">
            {host ?? "Pega la URL para identificar el destino"}
          </p>
        </div>
      </div>

      <PolariaFormInput
        id={`${idPrefix}-descripcion`}
        label="Nombre del reporte"
        required
        value={values.descripcion}
        placeholder="Ej. Reporte de inventario"
        onChange={(event) => onChange({ descripcion: event.target.value })}
        disabled={disabled}
        autoFocus
        compact
      />

      <PolariaFormInput
        id={`${idPrefix}-url`}
        label="URL del reporte"
        required
        type="url"
        value={values.embedUrl}
        placeholder="https://…"
        onChange={(event) => onChange({ embedUrl: event.target.value })}
        disabled={disabled}
        compact
      />

      {showEstado ? (
        <fieldset className="grid gap-2">
          <legend className="polaria-text-caption font-medium text-polaria-w-50">
            Estado
          </legend>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onChange({ estaActivo: true })}
              disabled={disabled}
              className={cn(
                "rounded-xl border px-3 py-2.5 polaria-text-body-sm font-medium transition",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal",
                values.estaActivo
                  ? "border-polaria-t-20 bg-polaria-t-08 text-polaria-teal"
                  : "border-polaria-w-08 bg-polaria-w-08 text-polaria-w-50 hover:border-polaria-t-20 hover:text-polaria-w",
              )}
            >
              Activo
            </button>
            <button
              type="button"
              onClick={() => onChange({ estaActivo: false })}
              disabled={disabled}
              className={cn(
                "rounded-xl border px-3 py-2.5 polaria-text-body-sm font-medium transition",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal",
                !values.estaActivo
                  ? "border-polaria-t-20 bg-polaria-t-08 text-polaria-teal"
                  : "border-polaria-w-08 bg-polaria-w-08 text-polaria-w-50 hover:border-polaria-t-20 hover:text-polaria-w",
              )}
            >
              Inactivo
            </button>
          </div>
        </fieldset>
      ) : null}
    </div>
  );
}
