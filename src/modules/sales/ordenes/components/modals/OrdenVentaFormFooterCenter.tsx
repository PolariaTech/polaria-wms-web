"use client";

import { cn } from "@/lib/utils/cn";
import type { RevisionPendiente } from "../../utils/ot/por-confirmar-revision-alert";

type ReagruparBanner = {
  correccion?: unknown;
  resumen: { antes: number; despues: number };
};

/**
 * REQ-195: alertas fijas del pie (reorg Mateo, error, revisión, bloqueo Confirmar).
 */
export function OrdenVentaFormFooterCenter(props: {
  step: string;
  reagruparAplicada: ReagruparBanner | null;
  onDeshacerReagrupacion: () => void;
  error: string | null;
  revisionPendiente: RevisionPendiente | null;
  confirmBloqueoReason: string | null;
  confirmSubmitDisabled: boolean;
  paginarPorOt: boolean;
  ordenesTrabajoCount: number;
  formOtSafePage: number;
  onGoToOtPage: (page: number) => void;
  onFocusRevision: (pendiente: RevisionPendiente) => void;
  onRequestRevisionFocus: (pendiente: RevisionPendiente) => void;
  onClearRevisionFocusRequest: () => void;
}) {
  const {
    step,
    reagruparAplicada,
    onDeshacerReagrupacion,
    error,
    revisionPendiente,
    confirmBloqueoReason,
    confirmSubmitDisabled,
    paginarPorOt,
    ordenesTrabajoCount,
    formOtSafePage,
    onGoToOtPage,
    onFocusRevision,
    onRequestRevisionFocus,
    onClearRevisionFocusRequest,
  } = props;

  const show =
    Boolean(reagruparAplicada) ||
    (step === "form" &&
      Boolean(revisionPendiente || error || confirmBloqueoReason));
  if (!show) return null;

  return (
    <div className="flex min-w-0 flex-wrap items-center justify-center gap-2">
      {reagruparAplicada ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-polaria-t-20 bg-polaria-t-08 px-2.5 py-1.5">
          <span className="polaria-text-caption text-polaria-w">
            {`${reagruparAplicada.correccion ? "Corregido con el correo" : "Reorganizado con IA"} (${reagruparAplicada.resumen.antes} → ${reagruparAplicada.resumen.despues} OT). Guarda para conservarlo.`}
          </span>
          <button
            type="button"
            onClick={onDeshacerReagrupacion}
            title="Restaura las órdenes de trabajo como estaban antes (se pierden los cambios hechos después)"
            className={cn(
              "rounded-md border border-polaria-t-20 px-2 py-0.5",
              "polaria-text-caption font-semibold text-polaria-teal transition hover:bg-polaria-t-08",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
            )}
          >
            Deshacer
          </button>
        </div>
      ) : null}
      {step === "form" && error ? (
        <p
          role="alert"
          className="max-w-full rounded-lg border border-polaria-danger-border bg-polaria-danger-bg px-2.5 py-1.5 polaria-text-caption font-medium text-polaria-danger"
        >
          <span className="line-clamp-2 break-words">{error}</span>
        </p>
      ) : null}
      {step === "form" && !error && revisionPendiente ? (
        <button
          type="button"
          onClick={() => {
            onRequestRevisionFocus(revisionPendiente);
            if (
              revisionPendiente.otIndex != null &&
              paginarPorOt &&
              ordenesTrabajoCount > 1 &&
              formOtSafePage !== revisionPendiente.otIndex
            ) {
              onGoToOtPage(revisionPendiente.otIndex);
              return;
            }
            onFocusRevision(revisionPendiente);
            onClearRevisionFocusRequest();
          }}
          className={cn(
            "max-w-full cursor-pointer rounded-lg border border-polaria-warning-border bg-polaria-warning-bg px-2.5 py-1.5 text-left",
            "polaria-text-caption font-medium text-polaria-warning hover:opacity-90",
          )}
          title="Ir al campo pendiente"
        >
          <span className="line-clamp-2 break-words">
            {revisionPendiente.message}
          </span>
        </button>
      ) : null}
      {step === "form" &&
      !error &&
      !revisionPendiente &&
      confirmBloqueoReason &&
      confirmSubmitDisabled ? (
        <p
          role="status"
          className="max-w-full rounded-lg border border-polaria-warning-border bg-polaria-warning-bg px-2.5 py-1.5 polaria-text-caption font-medium text-polaria-warning"
        >
          <span className="line-clamp-2 break-words">
            {confirmBloqueoReason}
          </span>
        </p>
      ) : null}
    </div>
  );
}
