import { Loader2 } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type PolariaFormModalFooterProps = {
  compact: boolean;
  footerLeading?: ReactNode;
  footerCenter?: ReactNode;
  footerBeforeCancel?: ReactNode;
  footerAction?: ReactNode;
  cancelLabel: string;
  submitLabel: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
  submitDisabled: boolean;
  submittingIndicator?: ReactNode;
  asForm: boolean;
};

export function PolariaFormModalFooter({
  compact,
  footerLeading,
  footerCenter,
  footerBeforeCancel,
  footerAction,
  cancelLabel,
  submitLabel,
  onClose,
  onSubmit,
  isSubmitting,
  submitDisabled,
  submittingIndicator,
  asForm,
}: PolariaFormModalFooterProps) {
  const footerClassName = cn(
    "flex shrink-0 flex-wrap items-center gap-3 border-t border-polaria-w-08",
    footerLeading || footerCenter ? "justify-between" : "justify-end",
    compact ? "mt-3 pt-3" : "mt-4 pt-4",
  );

  return (
    <div className={footerClassName}>
      {footerLeading ? (
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          {footerLeading}
        </div>
      ) : null}

      {footerCenter ? (
        <div className="flex min-w-0 flex-1 items-center justify-center px-1">
          {footerCenter}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-3">
        {footerBeforeCancel ? (
          <div className="flex items-center gap-2">{footerBeforeCancel}</div>
        ) : null}
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
            type={asForm ? "submit" : "button"}
            disabled={isSubmitting || submitDisabled}
            onClick={
              asForm
                ? undefined
                : (event) => {
                    onSubmit(event as unknown as FormEvent<HTMLFormElement>);
                  }
            }
            className={cn(
              "inline-flex min-w-[7rem] items-center justify-center gap-2 rounded-xl bg-polaria-teal px-4 py-2.5",
              "polaria-text-body-sm font-semibold text-polaria-on-teal transition hover:opacity-90",
              "disabled:cursor-not-allowed disabled:opacity-60",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
            )}
          >
            {isSubmitting
              ? (submittingIndicator ?? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ))
              : null}
            {submitLabel}
          </button>
        )}
      </div>
    </div>
  );
}
