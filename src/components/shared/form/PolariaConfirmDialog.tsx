"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useId, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

const CONFIRM_STACK_CLASS = {
  base: "z-[100]",
  elevated: "z-[110]",
  nested: "z-[120]",
} as const;

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
  /** Capa sobre otro modal (p. ej. captura OV). Default `base`. */
  stackLevel?: "base" | "elevated" | "nested";
  /**
   * Con Cypher abierto: panel a la izquierda (no tapar ni taparse con Cypher).
   */
  layout?: "center" | "dock-left";
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
  stackLevel = "base",
  layout = "center",
}: PolariaConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dockLeft = layout === "dock-left";
  const dockRightReserve = "pr-[min(100vw,38.5rem)]";
  const dockBackdropRight = "right-[min(100vw,38.5rem)]";

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
      className={cn(
        "fixed inset-0 flex overflow-hidden",
        dockLeft
          ? cn(
              "items-stretch justify-start pt-[var(--polaria-shell-top,4.75rem)]",
              dockRightReserve,
            )
          : "items-center justify-center p-3 sm:p-6",
        CONFIRM_STACK_CLASS[stackLevel],
      )}
      role="presentation"
    >
      <button
        type="button"
        aria-label="Cerrar"
        disabled={isSubmitting}
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-polaria-bg/80 backdrop-blur-sm disabled:cursor-not-allowed",
          dockLeft &&
            cn(dockBackdropRight, "top-[var(--polaria-shell-top,4.75rem)]"),
        )}
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description || children ? descriptionId : undefined}
        className={cn(
          "relative z-10 flex min-h-0 w-full flex-col overflow-hidden border-polaria-t-20 bg-polaria-t-08 backdrop-blur-xl",
          dockLeft
            ? "h-full max-h-none max-w-none flex-1 rounded-none border-0 border-t border-r"
            : cn(
                "polaria-card-glow max-h-[min(88dvh,40rem)] rounded-2xl border",
                size === "lg" ? "max-w-2xl" : "max-w-md",
              ),
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
                "polaria-text-body-sm font-semibold text-polaria-on-teal transition hover:opacity-90",
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
