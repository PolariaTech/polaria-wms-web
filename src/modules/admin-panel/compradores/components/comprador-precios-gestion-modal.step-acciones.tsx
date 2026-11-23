"use client";

import { Download, Printer, Upload } from "lucide-react";
import {
  ACTION_BUTTON_SECONDARY_CLASS,
  type ModalStep,
} from "./comprador-precios-gestion-modal.utils";

interface CompradorPreciosStepAccionesProps {
  isBusy: boolean;
  isParsingImport: boolean;
  isImporting: boolean;
  exportDisabled: boolean;
  importDisabled: boolean;
  printDisabled: boolean;
  onStep: (step: ModalStep) => void;
  onPickFile: () => void;
}

export function CompradorPreciosStepAcciones({
  isBusy,
  isParsingImport,
  isImporting,
  exportDisabled,
  importDisabled,
  printDisabled,
  onStep,
  onPickFile,
}: CompradorPreciosStepAccionesProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <button
        type="button"
        onClick={() => onStep("exportar")}
        disabled={isBusy || exportDisabled}
        className={ACTION_BUTTON_SECONDARY_CLASS}
      >
        <Download className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        Exportar
      </button>

      <button
        type="button"
        onClick={onPickFile}
        disabled={isBusy || importDisabled}
        className={ACTION_BUTTON_SECONDARY_CLASS}
      >
        <Upload className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        {isParsingImport
          ? "Leyendo…"
          : isImporting
            ? "Importando…"
            : "Importar"}
      </button>

      <button
        type="button"
        onClick={() => onStep("imprimir")}
        disabled={isBusy || printDisabled}
        className={ACTION_BUTTON_SECONDARY_CLASS}
      >
        <Printer className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        Imprimir
      </button>
    </div>
  );
}
