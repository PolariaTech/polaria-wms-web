"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useId, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface PolariaConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  /** Resumen corto; si hay `children`, este texto queda como intro arriba. */
  description?: string;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  error?: string | null;
  /** Ancho del panel. Default `md`. */
  size?: "md" | "lg";
}

export function PolariaConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  children,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  isSubmitting = false,
  error = null,
  size = "md",
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
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden p-3 sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Cerrar"
        disabled={isSubmitting}
        onClick={onClose}
        className="absolute inset-0 bg-polaria-bg/80 backdrop-blur-sm disabled:cursor-not-allowed"
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description || children ? descriptionId : undefined}
        className={cn(
          "polaria-card-glow relative z-10 flex w-full max-h-[min(88dvh,40rem)] flex-col overflow-hidden rounded-2xl border border-polaria-t-20 bg-polaria-t-08 backdrop-blur-xl",
          size === "lg" ? "max-w-2xl" : "max-w-md",
        )}
      >
        <div className="shrink-0 border-b border-polaria-w-08 px-5 pb-3 pt-5 sm:px-6 sm:pt-6">
          <p className="polaria-text-caption uppercase tracking-wide text-polaria-teal">
            Confirmar
          </p>
          <h2
            id={titleId}
            className="mt-1 polaria-text-title font-semibold text-polaria-w"
          >
            {title}
          </h2>
          {description ? (
            <p
              id={children ? undefined : descriptionId}
              className="mt-2 polaria-text-body-sm text-polaria-w-50"
            >
              {description}
            </p>
          ) : null}
        </div>

        {children || error ? (
          <div
            id={children ? descriptionId : undefined}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-3 sm:px-6"
          >
            {children}
            {error ? (
              <p
                role="alert"
                className="mt-3 rounded-xl border border-polaria-warning-border bg-polaria-warning-bg px-3 py-2 polaria-text-body-sm text-polaria-warning"
              >
                {error}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="shrink-0 border-t border-polaria-w-08 px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
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
