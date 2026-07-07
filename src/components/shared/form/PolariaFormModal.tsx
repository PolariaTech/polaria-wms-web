"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useId, type FormEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface PolariaFormModalProps {
  open: boolean;
  onClose: () => void;
  sectionLabel?: string;
  title: string;
  description?: string;
  children: ReactNode;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  error?: string | null;
  isSubmitting?: boolean;
  /** Deshabilita solo el botón de envío (sin bloquear cerrar/cancelar). */
  submitDisabled?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  closeLabel?: string;
  className?: string;
  /** Formularios largos: menos padding y cabecera compacta. */
  compact?: boolean;
  /** Ancho máximo del panel; por defecto según `compact`. */
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  /** Reemplaza el botón principal del pie (p. ej. acción de detalle). */
  footerAction?: ReactNode;
}

const MODAL_SIZE_CLASS = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  "2xl": "max-w-5xl",
} as const;

export function PolariaFormModal({
  open,
  onClose,
  sectionLabel,
  title,
  description,
  children,
  onSubmit,
  error,
  isSubmitting = false,
  submitDisabled = false,
  submitLabel = "Guardar",
  cancelLabel = "Cancelar",
  closeLabel = "Cerrar",
  className,
  compact = false,
  size,
  footerAction,
}: PolariaFormModalProps) {
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
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isSubmitting, onClose, open]);

  if (!open) {
    return null;
  }

  const widthClass =
    size != null
      ? MODAL_SIZE_CLASS[size]
      : compact
        ? MODAL_SIZE_CLASS.sm
        : MODAL_SIZE_CLASS.md;

  return (
    <div className="polaria-scrollbar fixed inset-0 z-[100] overflow-y-auto overscroll-contain">
      <div className="flex min-h-full items-center justify-center px-4 py-10 sm:px-6 sm:py-12">
        <button
          type="button"
          aria-label="Cerrar modal"
          className="fixed inset-0 bg-polaria-bg/80 backdrop-blur-sm"
          onClick={() => {
            if (!isSubmitting) onClose();
          }}
        />

        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descriptionId : undefined}
          className={cn(
            "polaria-card-glow relative z-10 flex w-full flex-col rounded-2xl border border-polaria-t-20 bg-polaria-t-08 backdrop-blur-xl",
            "max-h-[min(85dvh,calc(100dvh-5rem))]",
            widthClass,
            compact ? "p-4 sm:p-5" : "p-6 sm:p-8",
            className,
          )}
        >
          <div
            className={cn(
              "flex shrink-0 items-start justify-between gap-4",
              compact ? "mb-4" : "mb-6",
            )}
          >
            <div className="min-w-0">
              {sectionLabel ? (
                <p className="polaria-text-label text-polaria-teal">
                  {sectionLabel}
                </p>
              ) : null}
              <h2
                id={titleId}
                className={cn(
                  "polaria-text-card-title mt-1",
                  compact && "text-lg sm:text-xl",
                )}
              >
                {title}
              </h2>
              {description ? (
                <p
                  id={descriptionId}
                  className={cn(
                    "polaria-text-subtitle",
                    compact ? "mt-1 text-sm" : "mt-2",
                  )}
                >
                  {description}
                </p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className={cn(
                "shrink-0 rounded-lg border border-polaria-w-08 px-3 py-1.5",
                "polaria-text-body-sm text-polaria-w transition hover:border-polaria-t-20 hover:text-polaria-teal",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
              )}
            >
              {closeLabel}
            </button>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col">
            <div
              className={cn(
                "polaria-scrollbar overflow-y-auto pr-1",
                compact ? "space-y-3" : "space-y-5",
                "max-h-[min(60dvh,calc(100dvh-14rem))]",
              )}
            >
              {children}

              {error ? (
                <p
                  role="alert"
                  className="rounded-lg border border-polaria-danger-border bg-polaria-danger-bg px-3 py-2 polaria-text-body-sm text-polaria-danger"
                >
                  {error}
                </p>
              ) : null}
            </div>

            <div
              className={cn(
                "flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-polaria-w-08",
                compact ? "mt-3 pt-3" : "mt-4 pt-4",
              )}
            >
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

            {footerAction ?? (
              <button
                type="submit"
                disabled={isSubmitting || submitDisabled}
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
                {submitLabel}
              </button>
            )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
