"use client";

import { Download, Printer, Upload } from "lucide-react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { cn } from "@/lib/utils/cn";

interface CompradorPreciosGestionModalProps {
  open: boolean;
  onClose: () => void;
  onExport: () => void;
  isExporting?: boolean;
  exportDisabled?: boolean;
  error?: string | null;
}

const ACTION_BUTTON_CLASS = cn(
  "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3",
  "polaria-text-body-sm font-semibold transition",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
);

export function CompradorPreciosGestionModal({
  open,
  onClose,
  onExport,
  isExporting = false,
  exportDisabled = false,
  error = null,
}: CompradorPreciosGestionModalProps) {
  return (
    <PolariaFormModal
      open={open}
      onClose={onClose}
      sectionLabel="Compradores"
      title="Gestión de precios"
      description="Elige una acción para la plantilla de precios."
      onSubmit={(event) => event.preventDefault()}
      asForm={false}
      hideFooter
      compact
      size="sm"
      isSubmitting={isExporting}
      error={error}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={onExport}
          disabled={isExporting || exportDisabled}
          className={cn(
            ACTION_BUTTON_CLASS,
            "border border-polaria-t-20 text-polaria-teal hover:bg-polaria-t-08",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          <Download className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          {isExporting ? "Exportando…" : "Exportar"}
        </button>

        <button
          type="button"
          disabled
          title="Disponible en una siguiente iteración"
          className={cn(
            ACTION_BUTTON_CLASS,
            "cursor-not-allowed border border-polaria-w-08 text-polaria-w-20 opacity-60",
          )}
        >
          <Upload className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          Importar
        </button>

        <button
          type="button"
          disabled
          title="Disponible en una siguiente iteración"
          className={cn(
            ACTION_BUTTON_CLASS,
            "cursor-not-allowed border border-polaria-w-08 text-polaria-w-20 opacity-60",
          )}
        >
          <Printer className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          Imprimir
        </button>
      </div>
    </PolariaFormModal>
  );
}
