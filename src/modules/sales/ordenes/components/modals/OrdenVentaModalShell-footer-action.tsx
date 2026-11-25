"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { OrdenVentaFormEstado } from "./OrdenVentaDiscrepanciasDialog";

export function OrdenVentaModalFooterAction({
  estado,
  soloLectura,
}: {
  estado: OrdenVentaFormEstado;
  soloLectura: boolean;
}) {
  if (soloLectura) {
    return <></>;
  }
  if (estado.step === "pickOt") {
    return <></>;
  }
  if (estado.step === "preview") {
    return (
      <button
        type="button"
        onClick={() => {
          estado.setFormOtPage(0);
          estado.setStep("form");
          estado.setError(null);
        }}
        className={cn(
          "rounded-xl bg-polaria-teal px-5 py-2.5",
          "polaria-text-body-sm font-semibold text-polaria-on-teal transition hover:opacity-90",
        )}
      >
        Continuar al formulario
      </button>
    );
  }
  if (estado.step === "start" && estado.startMode === "docs") {
    return (
      <button
        type="button"
        onClick={() => {
          void estado.openFormFromDocs();
        }}
        disabled={!estado.docsReady || estado.isReadingIa}
        className={cn(
          "inline-flex min-w-[7rem] items-center justify-center gap-2 rounded-xl bg-polaria-teal px-5 py-2.5",
          "polaria-text-body-sm font-semibold text-polaria-on-teal transition hover:opacity-90",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        {estado.isReadingIa ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : null}
        Continuar
      </button>
    );
  }
  if (estado.step === "start") {
    return <></>;
  }
  if (estado.step === "form") {
    return (
      <button
        type="submit"
        disabled={soloLectura || estado.confirmSubmitDisabled}
        title={
          soloLectura
            ? "Solo lectura: otro usuario está editando"
            : estado.confirmSubmitDisabled
              ? (estado.confirmBloqueoReason ?? "Completa lo pendiente para confirmar")
              : undefined
        }
        aria-disabled={soloLectura || estado.confirmSubmitDisabled}
        className={cn(
          "inline-flex min-w-[7rem] items-center justify-center gap-2 rounded-xl bg-polaria-teal px-4 py-2.5",
          "polaria-text-body-sm font-semibold text-polaria-on-teal transition hover:opacity-90",
          "disabled:cursor-not-allowed disabled:opacity-60",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
        )}
      >
        {estado.isSaving ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : null}
        {estado.isEditing &&
        estado.editingEstado !== "por_confirmar" &&
        !estado.pendingEmitId
          ? "Actualizar"
          : "Confirmar"}
      </button>
    );
  }
  return null;
}
