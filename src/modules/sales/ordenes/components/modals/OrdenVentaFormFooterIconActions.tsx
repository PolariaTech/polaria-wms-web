"use client";

import { Loader2, Save, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  tooltipEliminarTareaOt,
  tooltipGuardarAvanceVenta,
} from "./orden-venta-footer-icon-tooltips";

type OrdenVentaFormFooterIconActionsProps = {
  showEliminar: boolean;
  indiceOt1Based: number;
  onEliminar: () => void;
  onGuardarAvance: () => void;
  guardarDisabled: boolean;
  isSaving: boolean;
};

const iconBtnClass =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg disabled:cursor-not-allowed disabled:opacity-40";

/** Iconos Eliminar OT + Guardar avance junto a Cancelar (REQ-232). */
export function OrdenVentaFormFooterIconActions({
  showEliminar,
  indiceOt1Based,
  onEliminar,
  onGuardarAvance,
  guardarDisabled,
  isSaving,
}: OrdenVentaFormFooterIconActionsProps) {
  const tipEliminar = tooltipEliminarTareaOt(indiceOt1Based);
  const tipGuardar = tooltipGuardarAvanceVenta();

  return (
    <div className="flex items-center gap-2">
      {showEliminar ? (
        <button
          type="button"
          title={tipEliminar}
          aria-label={tipEliminar}
          onClick={onEliminar}
          className={cn(
            iconBtnClass,
            "border-polaria-danger-border bg-polaria-danger-bg text-polaria-danger hover:opacity-90",
          )}
        >
          <Trash2 className="h-4 w-4" strokeWidth={2.25} aria-hidden />
        </button>
      ) : null}
      <button
        type="button"
        title={tipGuardar}
        aria-label={tipGuardar}
        disabled={guardarDisabled}
        onClick={onGuardarAvance}
        className={cn(
          iconBtnClass,
          "border-polaria-t-20 bg-transparent text-polaria-teal hover:bg-polaria-t-08",
        )}
      >
        {isSaving ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Save className="h-4 w-4" strokeWidth={2.25} aria-hidden />
        )}
      </button>
    </div>
  );
}
