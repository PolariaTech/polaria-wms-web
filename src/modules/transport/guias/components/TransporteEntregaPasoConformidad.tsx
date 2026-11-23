"use client";

import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface TransporteEntregaPasoConformidadProps {
  conforme: boolean | null;
  descripcion: string;
  onConforme: () => void;
  onNoConforme: () => void;
  onChangeDescripcion: (value: string) => void;
}

export function TransporteEntregaPasoConformidad({
  conforme,
  descripcion,
  onConforme,
  onNoConforme,
  onChangeDescripcion,
}: TransporteEntregaPasoConformidadProps) {
  return (
    <section className="rounded-xl border border-polaria-t-20 bg-polaria-t-08 p-3">
      <p className="mb-1 flex items-center gap-2 polaria-text-caption font-semibold uppercase tracking-wide text-polaria-teal">
        <CheckCircle2 className="h-4 w-4" aria-hidden />
        Conformidad
      </p>
      <p className="mb-3 polaria-text-caption text-polaria-w-50">
        El cierre final combina conformidad y si las cantidades coinciden con
        el pedido.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onConforme}
          className={cn(
            "rounded-xl border px-3 py-2.5 polaria-text-body-sm font-semibold transition",
            conforme === true
              ? "border-polaria-teal bg-polaria-teal text-polaria-on-teal"
              : "border-polaria-t-20 bg-polaria-w-08 text-polaria-w hover:border-polaria-teal",
          )}
        >
          Sí, conforme
        </button>
        <button
          type="button"
          onClick={onNoConforme}
          className={cn(
            "rounded-xl border px-3 py-2.5 polaria-text-body-sm font-semibold transition",
            conforme === false
              ? "border-polaria-danger bg-polaria-danger-bg text-polaria-danger"
              : "border-polaria-t-20 bg-polaria-w-08 text-polaria-w hover:border-polaria-teal",
          )}
        >
          No conforme
        </button>
      </div>
      {conforme === false ? (
        <label className="mt-3 grid gap-1.5">
          <span className="polaria-text-caption text-polaria-w-50">
            ¿Por qué no?
          </span>
          <textarea
            value={descripcion}
            onChange={(event) => onChangeDescripcion(event.target.value)}
            rows={3}
            className="w-full rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-3 py-2 polaria-text-body-sm text-polaria-w outline-none focus:border-polaria-t-20"
            placeholder="Describí la incidencia"
          />
        </label>
      ) : null}
    </section>
  );
}
