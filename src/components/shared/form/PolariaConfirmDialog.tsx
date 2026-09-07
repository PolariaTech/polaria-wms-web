"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useId } from "react";
import { cn } from "@/lib/utils/cn";

export interface PolariaConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  error?: string | null;
}

export function PolariaConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  isSubmitting = false,
  error = null,
}: PolariaConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitting, onClose, open]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="polaria-scrollbar fixed inset-0 z-[100] overflow-y-auto overscroll-contain"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Cerrar"
        disabled={isSubmitting}
        onClick={onClose}
        className="fixed inset-0 bg-polaria-bg/80 backdrop-blur-sm disabled:cursor-not-allowed"
      />

      <div className="relative flex min-h-full items-center justify-center p-4 sm:p-6">
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          className={cn(
            "polaria-card-glow relative z-10 w-full max-w-md rounded-2xl border border-polaria-t-20 bg-polaria-t-08 p-5 backdrop-blur-xl sm:p-6",
          )}
        >
          <p className="polaria-text-caption uppercase tracking-wide text-polaria-teal">
            Confirmar
          </p>
          <h2
            id={titleId}
            className="mt-1 polaria-text-title font-semibold text-polaria-w"
          >
            {title}
          </h2>
          <p
            id={descriptionId}
            className="mt-2 polaria-text-body-sm text-polaria-w-50"
          >
            {description}
          </p>

          {error ? (
            <p
              role="alert"
              className="mt-3 rounded-xl border border-polaria-warning-border bg-polaria-warning-bg px-3 py-2 polaria-text-body-sm text-polaria-warning"
            >
              {error}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className={cn(
                "rounded-xl border border-polaria-w-08 px-4 py-2.5",
                "polaria-text-body-sm text-polaria-w transition hover:border-polaria-t-20 hover:text-polaria-teal",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
              )}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isSubmitting}
              className={cn(
                "inline-flex min-w-[7rem] items-center justify-center gap-2 rounded-xl bg-polaria-teal px-4 py-2.5",
                "polaria-text-body-sm font-semibold text-polaria-bg transition hover:opacity-90",
                "disabled:cursor-not-allowed disabled:opacity-60",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
              )}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : null}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
