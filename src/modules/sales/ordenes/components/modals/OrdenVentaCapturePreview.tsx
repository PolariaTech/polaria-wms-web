"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { OrdenTrabajoPreviewList } from "../orden-trabajo/OrdenTrabajoPreviewList";
import type { OrdenTrabajoHija } from "../../utils/origen/origen-correo-ordenes-trabajo";
import { OrdenVentaModalDialogs } from "./OrdenVentaCapturePreview-dialogs";

export { OrdenVentaModalDialogs };

export function OrdenVentaCapturePreview({
  clienteLabel,
  hijas,
  page,
  onRemoveHija,
  onAddTarea,
}: {
  clienteLabel: string;
  hijas: OrdenTrabajoHija[];
  page: number;
  onRemoveHija: (hijaId: string) => void;
  onAddTarea: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <OrdenTrabajoPreviewList
        clienteLabel={clienteLabel}
        hijas={hijas}
        page={page}
        onRemoveHija={onRemoveHija}
      />
      <button
        type="button"
        onClick={onAddTarea}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-4 py-2.5",
          "polaria-text-body-sm font-semibold text-polaria-w transition hover:border-polaria-teal",
        )}
      >
        <Plus className="h-4 w-4 text-polaria-teal" aria-hidden />
        Agregar tarea de almacén
      </button>
    </div>
  );
}

