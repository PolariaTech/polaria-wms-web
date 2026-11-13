"use client";

import {
  useEffect,
  useId,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { cn } from "@/lib/utils/cn";
import { useBodyScrollLock } from "@/lib/utils/use-body-scroll-lock";
import {
  cypherDockReserveClass,
  cypherDockRightClass,
} from "@/modules/sales/ordenes/constants/cypher-layout";
import { useShellOverlayStore } from "@/stores/shell-overlay.store";
import {
  MODAL_SIZE_CLASS,
  MODAL_STACK_CLASS,
} from "./polaria-form-modal-layout";
import type { PolariaFormModalProps } from "./polaria-form-modal-props";
import { PolariaFormModalFooter } from "./PolariaFormModalFooter";
import { useModalFocus } from "./use-modal-focus";

export type { PolariaFormModalProps } from "./polaria-form-modal-props";

/**
 * Apilamiento. Con Cypher abierto los pickers deben usar `layout="dock-left"`.
 */
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
  submittingIndicator,
  submitDisabled = false,
  submitLabel = "Guardar",
  cancelLabel = "Cancelar",
  closeLabel = "Cerrar",
  className,
  compact = false,
  size,
  scrollClassName: scrollClassNameProp,
  footerAction,
  footerLeading,
  footerCenter,
  footerBeforeCancel,
  hideFooter = false,
  hideHeaderClose = false,
  headerTrailing,
  headerCenter,
  layout = "center",
  asForm = true,
  stackLevel = "base",
  closeOnEscape = true,
  closeOnBackdrop = true,
  submitOnEnter = true,
  scrollRegionRef,
}: PolariaFormModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalFocus(open, dialogRef);
  const cypherWidthMode = useShellOverlayStore((s) => s.cypherWidthMode);

  useEffect(() => {
    if (!open || !closeOnEscape) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        if (stackLevel !== "base") {
          event.stopPropagation();
        }
        onClose();
      }
    };

    const useCapture = stackLevel !== "base";
    document.addEventListener("keydown", handleKeyDown, useCapture);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, useCapture);
    };
  }, [closeOnEscape, isSubmitting, onClose, open, stackLevel]);

  useBodyScrollLock(open);

  const handleFormKeyDown = (event: ReactKeyboardEvent<HTMLFormElement>) => {
    if (
      submitOnEnter ||
      event.key !== "Enter" ||
      event.nativeEvent.isComposing
    ) {
      return;
    }
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.tagName === "TEXTAREA") return;
    if (target instanceof HTMLButtonElement && target.type === "submit") return;
    event.preventDefault();
  };

  if (!open) return null;

  const widthClass =
    size != null
      ? MODAL_SIZE_CLASS[size]
      : compact
        ? MODAL_SIZE_CLASS.sm
        : MODAL_SIZE_CLASS.md;
  const bodyClassName = cn("flex min-h-0 flex-1 flex-col overflow-hidden");
  const scrollClassName = cn(
    "polaria-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1",
    compact ? "space-y-3" : "space-y-5",
    scrollClassNameProp,
  );

  const bodyContent = (
    <>
      <div ref={scrollRegionRef} className={scrollClassName}>
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
      {hideFooter ? null : (
        <PolariaFormModalFooter
          compact={compact}
          footerLeading={footerLeading}
          footerCenter={footerCenter}
          footerBeforeCancel={footerBeforeCancel}
          footerAction={footerAction}
          cancelLabel={cancelLabel}
          submitLabel={submitLabel}
          onClose={onClose}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          submitDisabled={submitDisabled}
          submittingIndicator={submittingIndicator}
          asForm={asForm}
        />
      )}
    </>
  );

  const dockLeft = layout === "dock-left";
  const dockRightReserve = cypherDockReserveClass(cypherWidthMode);
  const dockBackdropRight = cypherDockRightClass(cypherWidthMode);

  return (
    <div
      className={cn(
        "fixed inset-0 flex overflow-hidden transition-[padding] duration-[320ms] ease-out",
        dockLeft
          ? cn(
              "items-stretch justify-start pt-[var(--polaria-shell-top,4.75rem)]",
              dockRightReserve,
            )
          : "items-center justify-center px-4 py-6 sm:px-6 sm:py-10",
        MODAL_STACK_CLASS[stackLevel],
      )}
    >
      {closeOnBackdrop ? (
        <button
          type="button"
          tabIndex={-1}
          aria-label="Cerrar modal"
          className={cn(
            "absolute inset-0 bg-polaria-bg/80 backdrop-blur-sm transition-[top,right] duration-[320ms] ease-out",
            dockLeft &&
              cn(dockBackdropRight, "top-[var(--polaria-shell-top,4.75rem)]"),
          )}
          onClick={() => {
            if (!isSubmitting) onClose();
          }}
        />
      ) : (
        <div
          aria-hidden
          className={cn(
            "absolute inset-0 bg-polaria-bg/80 backdrop-blur-sm transition-[top,right] duration-[320ms] ease-out",
            dockLeft &&
              cn(dockBackdropRight, "top-[var(--polaria-shell-top,4.75rem)]"),
          )}
        />
      )}

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={cn(
          "relative z-10 flex min-h-0 min-w-0 flex-col overflow-hidden border-polaria-t-20 bg-polaria-t-08 backdrop-blur-xl",
          "transition-[border-radius,max-width,height,box-shadow] duration-[320ms] ease-out",
          dockLeft
            ? "h-full w-full max-h-none max-w-none flex-1 rounded-none border-0 border-t border-r border-polaria-t-20"
            : "polaria-card-glow w-full max-h-[min(85dvh,calc(100dvh-5rem))] rounded-2xl border",
          !dockLeft && widthClass,
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
          <div className={cn("min-w-0", headerCenter && "flex-1")}>
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

          {headerCenter ? (
            <div className="flex min-w-0 flex-1 items-center justify-center self-center px-2">
              {headerCenter}
            </div>
          ) : null}

          {headerTrailing != null ? (
            <div
              className={cn(
                "shrink-0",
                headerCenter && "flex flex-1 justify-end",
              )}
            >
              {headerTrailing}
            </div>
          ) : hideHeaderClose ? (
            headerCenter ? <div className="flex-1" /> : null
          ) : (
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
          )}
        </div>

        {asForm ? (
          <form
            onSubmit={onSubmit}
            onKeyDown={handleFormKeyDown}
            className={bodyClassName}
          >
            {bodyContent}
          </form>
        ) : (
          <div className={bodyClassName}>{bodyContent}</div>
        )}
      </div>
    </div>
  );
}
