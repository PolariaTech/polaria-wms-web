"use client";

import { Download } from "lucide-react";
import { PolariaFormField } from "@/components/shared/form/PolariaFormField";
import { JefeBodegaModalSearchField } from "@/modules/jefe-bodega/components/modals/jefe-bodega-modal-ui";
import { CompradorPreciosGruposSection } from "./comprador-precios-gestion-modal.grupos-section";
import type { CompradorPreciosPrintOption } from "./comprador-precios-gestion-modal.types";
import {
  ACTION_BUTTON_PRIMARY_CLASS,
  ACTION_BUTTON_SECONDARY_CLASS,
} from "./comprador-precios-gestion-modal.utils";

interface CompradorPreciosStepImprimirProps {
  isBusy: boolean;
  isPrinting: boolean;
  printDisabled: boolean;
  catalogoGrupos: readonly string[];
  printGrupos: string[];
  printCodigosComprador: string[];
  printCompradoresSeleccionados: readonly CompradorPreciosPrintOption[];
  printCompradorFieldValue: string;
  onGruposChange: (next: string[]) => void;
  onRemoveComprador: (codigo: string) => void;
  onOpenCompradorPicker: () => void;
  onBack: () => void;
  onConfirm: () => void;
}

export function CompradorPreciosStepImprimir({
  isBusy,
  isPrinting,
  printDisabled,
  catalogoGrupos,
  printGrupos,
  printCodigosComprador,
  printCompradoresSeleccionados,
  printCompradorFieldValue,
  onGruposChange,
  onRemoveComprador,
  onOpenCompradorPicker,
  onBack,
  onConfirm,
}: CompradorPreciosStepImprimirProps) {
  return (
    <div className="flex flex-col gap-4">
      <CompradorPreciosGruposSection
        catalogoGrupos={catalogoGrupos}
        selected={printGrupos}
        onChange={onGruposChange}
        disabled={isBusy}
      />

      <PolariaFormField
        id="precios-print-compradores"
        label="Compradores adicionales"
        compact
        hint="Opcional. Puedes elegir compradores de cualquier grupo."
      >
        <JefeBodegaModalSearchField
          id="precios-print-compradores"
          value={printCompradorFieldValue}
          placeholder="Buscar compradores…"
          ariaLabel="Compradores adicionales"
          compact
          onSearchClick={() => {
            if (!isBusy) onOpenCompradorPicker();
          }}
        />
      </PolariaFormField>

      {printCompradoresSeleccionados.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {printCompradoresSeleccionados.map((row) => (
            <button
              key={row.codigo}
              type="button"
              disabled={isBusy}
              onClick={() => onRemoveComprador(row.codigo)}
              className="rounded-lg border border-polaria-t-20 bg-polaria-t-08 px-2 py-1 polaria-text-body-sm text-polaria-w hover:opacity-90 disabled:opacity-60"
              title="Quitar"
            >
              {row.codigo}
              <span className="ml-1 text-polaria-w-50">×</span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isBusy}
          className={ACTION_BUTTON_SECONDARY_CLASS}
        >
          Volver
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={
            isBusy ||
            printDisabled ||
            (printGrupos.length === 0 && printCodigosComprador.length === 0)
          }
          className={ACTION_BUTTON_PRIMARY_CLASS}
        >
          <Download className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          {isPrinting ? "Generando…" : "Descargar Excel"}
        </button>
      </div>
    </div>
  );
}
