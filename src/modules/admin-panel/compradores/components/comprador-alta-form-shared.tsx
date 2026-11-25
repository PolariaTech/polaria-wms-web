"use client";

import { Plus } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import type { CompradorAltaCentroRow, CompradorAltaContactoRow, CompradorAltaFormFicha, CompradorAltaFormState } from "../utils/comprador-alta";

export function CaptureSection({
  title,
  optional,
  children,
}: {
  title: string;
  optional?: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-polaria-t-20 bg-polaria-t-08">
      <h3 className="flex items-center justify-between gap-3 border-b border-polaria-w-08 px-4 py-2.5 polaria-text-label uppercase tracking-wide text-polaria-teal">
        <span>{title}</span>
        {optional ? (
          <span className="normal-case tracking-normal text-polaria-w-50">
            {optional}
          </span>
        ) : null}
      </h3>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function AddRowButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "mt-3 inline-flex items-center gap-1 rounded-xl border border-polaria-teal px-4 py-2",
        "polaria-text-body-sm font-semibold text-polaria-teal transition hover:bg-polaria-t-08",
        "disabled:cursor-not-allowed disabled:opacity-50",
      )}
    >
      <Plus className="h-4 w-4" aria-hidden />
      {label}
    </button>
  );
}

export type CompradorAltaFormStep =
  | "all"
  | "fiscal"
  | "identificacion"
  | "condiciones"
  | "centros"
  | "contactos"
  | "canales"
  | "reglas";

export function patchFicha(
  form: CompradorAltaFormState,
  onChange: (next: CompradorAltaFormState) => void,
  patch: Partial<CompradorAltaFormFicha>,
) {
  onChange({ ...form, ficha: { ...form.ficha, ...patch } });
}

export function patchCentro(
  form: CompradorAltaFormState,
  onChange: (next: CompradorAltaFormState) => void,
  index: number,
  patch: Partial<CompradorAltaCentroRow>,
) {
  patchFicha(form, onChange, {
    centros: form.ficha.centros.map((row, i) =>
      i === index ? { ...row, ...patch } : row,
    ),
  });
}

export function patchContacto(
  form: CompradorAltaFormState,
  onChange: (next: CompradorAltaFormState) => void,
  index: number,
  patch: Partial<CompradorAltaContactoRow>,
) {
  patchFicha(form, onChange, {
    contactos: form.ficha.contactos.map((row, i) =>
      i === index ? { ...row, ...patch } : row,
    ),
  });
}

export function StepShell({
  show,
  bare,
  title,
  optional,
  children,
}: {
  show: boolean;
  bare: boolean;
  title: string;
  optional?: string;
  children: ReactNode;
}) {
  if (!show) return null;
  if (bare) {
    return <div className="space-y-3">{children}</div>;
  }
  return (
    <CaptureSection title={title} optional={optional}>
      {children}
    </CaptureSection>
  );
}
