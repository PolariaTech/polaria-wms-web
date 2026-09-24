"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Printer, Upload } from "lucide-react";
import { PolariaFormSelect } from "@/components/shared/form/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { cn } from "@/lib/utils/cn";
import type { CompradorPreciosPrintScope } from "../utils/comprador-precios-pdf";

export interface CompradorPreciosPrintOption {
  codigo: string;
  nombre: string;
}

interface CompradorPreciosGestionModalProps {
  open: boolean;
  onClose: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onPrint: (scope: CompradorPreciosPrintScope) => void;
  compradores?: readonly CompradorPreciosPrintOption[];
  isExporting?: boolean;
  isImporting?: boolean;
  isPrinting?: boolean;
  exportDisabled?: boolean;
  importDisabled?: boolean;
  printDisabled?: boolean;
  error?: string | null;
  status?: string | null;
}

const ACTION_BUTTON_CLASS = cn(
  "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3",
  "polaria-text-body-sm font-semibold transition",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
);

const PRINT_TODOS = "__todos__";

export function CompradorPreciosGestionModal({
  open,
  onClose,
  onExport,
  onImport,
  onPrint,
  compradores = [],
  isExporting = false,
  isImporting = false,
  isPrinting = false,
  exportDisabled = false,
  importDisabled = false,
  printDisabled = false,
  error = null,
  status = null,
}: CompradorPreciosGestionModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"acciones" | "imprimir">("acciones");
  const [printSelection, setPrintSelection] = useState(PRINT_TODOS);
  const isBusy = isExporting || isImporting || isPrinting;

  useEffect(() => {
    if (!open) return;
    setStep("acciones");
    setPrintSelection(PRINT_TODOS);
  }, [open]);

  const printOptions = useMemo(
    () => [
      { value: PRINT_TODOS, label: "Todos los compradores" },
      ...[...compradores]
        .sort((left, right) => left.nombre.localeCompare(right.nombre, "es"))
        .map((row) => ({
          value: row.codigo,
          label: `${row.codigo} — ${row.nombre}`,
        })),
    ],
    [compradores],
  );

  const handleClose = () => {
    if (isBusy) return;
    onClose();
  };

  const handleConfirmPrint = () => {
    if (isBusy || printDisabled) return;
    if (printSelection === PRINT_TODOS) {
      onPrint({ mode: "todos" });
      return;
    }
    onPrint({ mode: "one", codigoComprador: printSelection });
  };

  return (
    <PolariaFormModal
      open={open}
      onClose={handleClose}
      sectionLabel="Compradores"
      title="Gestión de precios"
      description={
        step === "imprimir"
          ? "Elige un comprador o imprime la lista completa."
          : "Elige una acción para la plantilla de precios."
      }
      onSubmit={(event) => event.preventDefault()}
      asForm={false}
      hideFooter
      compact
      size="sm"
      isSubmitting={isBusy}
      error={error}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) onImport(file);
        }}
      />

      {status ? (
        <p
          role="status"
          className="mb-3 rounded-lg border border-polaria-w-08 bg-polaria-w-08 px-3 py-2 polaria-text-body-sm text-polaria-w-50"
        >
          {status}
        </p>
      ) : null}

      {step === "acciones" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={onExport}
            disabled={isBusy || exportDisabled}
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
            onClick={() => fileInputRef.current?.click()}
            disabled={isBusy || importDisabled}
            className={cn(
              ACTION_BUTTON_CLASS,
              "border border-polaria-t-20 text-polaria-teal hover:bg-polaria-t-08",
              "disabled:cursor-not-allowed disabled:opacity-60",
            )}
          >
            <Upload className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            {isImporting ? "Importando…" : "Importar"}
          </button>

          <button
            type="button"
            onClick={() => setStep("imprimir")}
            disabled={isBusy || printDisabled}
            className={cn(
              ACTION_BUTTON_CLASS,
              "border border-polaria-t-20 text-polaria-teal hover:bg-polaria-t-08",
              "disabled:cursor-not-allowed disabled:opacity-60",
            )}
          >
            <Printer className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            Imprimir
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <PolariaFormSelect
            id="precios-print-scope"
            label="Comprador"
            compact
            value={printSelection}
            disabled={isBusy}
            onChange={(event) => setPrintSelection(event.target.value)}
            options={printOptions}
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setStep("acciones")}
              disabled={isBusy}
              className={cn(
                ACTION_BUTTON_CLASS,
                "border border-polaria-t-20 text-polaria-teal hover:bg-polaria-t-08",
                "disabled:cursor-not-allowed disabled:opacity-60",
              )}
            >
              Volver
            </button>
            <button
              type="button"
              onClick={handleConfirmPrint}
              disabled={isBusy || printDisabled || !printSelection}
              className={cn(
                ACTION_BUTTON_CLASS,
                "bg-polaria-teal text-polaria-bg hover:opacity-90",
                "disabled:cursor-not-allowed disabled:opacity-60",
              )}
            >
              <Printer className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              {isPrinting ? "Generando…" : "Generar PDF"}
            </button>
          </div>
        </div>
      )}
    </PolariaFormModal>
  );
}
