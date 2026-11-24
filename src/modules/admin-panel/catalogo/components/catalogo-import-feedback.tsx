"use client";

import { cn } from "@/lib/utils/cn";

interface CatalogoImportFeedbackProps {
  importMessage: string | null;
  importError: string | null;
}

export function CatalogoImportFeedback({
  importMessage,
  importError,
}: CatalogoImportFeedbackProps) {
  return (
    <>
      {importMessage ? (
        <p
          role="status"
          className="mb-4 rounded-lg border border-polaria-w-08 bg-polaria-w-08 px-3 py-2 polaria-text-body-sm text-polaria-w-50"
        >
          {importMessage}
        </p>
      ) : null}

      {importError ? (
        <p
          role="alert"
          className={cn(
            "mb-4 rounded-lg border px-3 py-2 polaria-text-body-sm",
            importMessage
              ? "border-polaria-warning-border bg-polaria-warning-bg text-polaria-warning"
              : "border-polaria-t-20 bg-polaria-t-08 text-polaria-w-50",
          )}
        >
          {importError}
        </p>
      ) : null}
    </>
  );
}
