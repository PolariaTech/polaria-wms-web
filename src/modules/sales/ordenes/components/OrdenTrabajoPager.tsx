"use client";

import { cn } from "@/lib/utils/cn";

export function OrdenTrabajoPager({
  page,
  total,
  label = "Orden de trabajo",
  onPrev,
  onNext,
  nextDisabled = false,
  nextDisabledHint,
  className,
}: {
  page: number;
  total: number;
  label?: string;
  onPrev: () => void;
  onNext: () => void;
  /** Bloquea Siguiente (p. ej. campos obligatorios en rojo). */
  nextDisabled?: boolean;
  nextDisabledHint?: string;
  className?: string;
}) {
  if (total <= 1) return null;

  const safePage = Math.min(Math.max(0, page), total - 1);
  const cannotNext = nextDisabled || safePage >= total - 1;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 sm:gap-3",
        className,
      )}
    >
      <button
        type="button"
        disabled={safePage <= 0}
        onClick={onPrev}
        className={cn(
          "rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-3 py-2",
          "polaria-text-body-sm font-medium text-polaria-w transition hover:border-polaria-teal",
          "disabled:cursor-not-allowed disabled:opacity-40",
        )}
      >
        ← Anterior
      </button>
      <div className="min-w-[7.5rem] text-center">
        <p className="polaria-text-caption text-polaria-w-50">
          <span className="font-medium text-polaria-teal">{label}</span>
          <span className="mx-1 text-polaria-w-20">·</span>
          {safePage + 1} de {total}
        </p>
        {nextDisabled && nextDisabledHint ? (
          <p className="mt-0.5 max-w-[14rem] polaria-text-caption text-polaria-danger">
            {nextDisabledHint}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        disabled={cannotNext}
        title={
          nextDisabled
            ? nextDisabledHint || "Completa los campos obligatorios"
            : undefined
        }
        onClick={onNext}
        className={cn(
          "rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-3 py-2",
          "polaria-text-body-sm font-medium text-polaria-w transition hover:border-polaria-teal",
          "disabled:cursor-not-allowed disabled:opacity-40",
        )}
      >
        Siguiente →
      </button>
    </div>
  );
}
