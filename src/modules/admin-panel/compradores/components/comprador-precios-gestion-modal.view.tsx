"use client";

import { useRef } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { CompradorTableMultiPickerModal } from "./CompradorTableMultiPickerModal";
import { CompradorPreciosStepAcciones } from "./comprador-precios-gestion-modal.step-acciones";
import { CompradorPreciosStepExportar } from "./comprador-precios-gestion-modal.step-exportar";
import { CompradorPreciosStepImportar } from "./comprador-precios-gestion-modal.step-importar";
import { CompradorPreciosStepImprimir } from "./comprador-precios-gestion-modal.step-imprimir";
import type { CompradorPreciosGestionModalProps } from "./comprador-precios-gestion-modal.types";
import {
  modalStepDescription,
  modalStepSize,
} from "./comprador-precios-gestion-modal.utils";
import { useCompradorPreciosGestionState } from "./use-comprador-precios-gestion-state";

export type {
  CompradorPreciosPrintOption,
  CompradorPreciosProductoOption,
} from "./comprador-precios-gestion-modal.types";

export function CompradorPreciosGestionModal(
  props: CompradorPreciosGestionModalProps,
) {
  const { open, error = null, status = null, productos = [] } = props;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const s = useCompradorPreciosGestionState(props);

  return (
    <>
      <PolariaFormModal
        open={open}
        onClose={s.handleClose}
        sectionLabel="Compradores"
        title="Gestión de precios"
        description={modalStepDescription(s.step)}
        onSubmit={(event) => event.preventDefault()}
        asForm={false}
        hideFooter
        compact
        size={modalStepSize(s.step)}
        isSubmitting={s.isBusy}
        error={error ?? (s.step === "importar-preview" ? s.importParseError : null)}
        closeOnEscape={!s.compradorPickerOpen}
        closeOnBackdrop={!s.compradorPickerOpen}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void s.handlePickImportFile(file);
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

        {s.step === "acciones" ? (
          <CompradorPreciosStepAcciones
            isBusy={s.isBusy}
            isParsingImport={s.isParsingImport}
            isImporting={s.isImporting}
            exportDisabled={s.exportDisabled}
            importDisabled={s.importDisabled}
            printDisabled={s.printDisabled}
            onStep={s.setStep}
            onPickFile={() => fileInputRef.current?.click()}
          />
        ) : null}

        {s.step === "exportar" ? (
          <CompradorPreciosStepExportar
            isBusy={s.isBusy}
            isExporting={s.isExporting}
            exportDisabled={s.exportDisabled}
            catalogoGrupos={s.catalogoGrupos}
            productos={productos}
            productoIds={s.productoIds}
            selectedGrupos={s.selectedGrupos}
            selectedProductos={s.selectedProductos}
            fechaInicio={s.fechaInicio}
            fechaFin={s.fechaFin}
            fechaRangoInvalido={s.fechaRangoInvalido}
            onGruposChange={s.setSelectedGrupos}
            onProductosChange={s.setSelectedProductos}
            onFechaInicioChange={s.setFechaInicio}
            onFechaFinChange={s.setFechaFin}
            onBack={() => s.setStep("acciones")}
            onConfirm={s.handleConfirmExport}
          />
        ) : null}

        {s.step === "imprimir" ? (
          <CompradorPreciosStepImprimir
            isBusy={s.isBusy}
            isPrinting={s.isPrinting}
            printDisabled={s.printDisabled}
            catalogoGrupos={s.catalogoGrupos}
            printGrupos={s.printGrupos}
            printCodigosComprador={s.printCodigosComprador}
            printCompradoresSeleccionados={s.printCompradoresSeleccionados}
            printCompradorFieldValue={s.printCompradorFieldValue}
            onGruposChange={s.setPrintGrupos}
            onRemoveComprador={(codigo) =>
              s.setPrintCodigosComprador((prev) =>
                prev.filter((item) => item !== codigo),
              )
            }
            onOpenCompradorPicker={() => s.setCompradorPickerOpen(true)}
            onBack={() => s.setStep("acciones")}
            onConfirm={s.handleConfirmPrint}
          />
        ) : null}

        {s.step === "importar-preview" ? (
          <CompradorPreciosStepImportar
            isBusy={s.isBusy}
            isImporting={s.isImporting}
            importDisabled={s.importDisabled}
            pendingImportFile={s.pendingImportFile}
            importPreviewRows={s.importPreviewRows}
            importTotalRows={s.importTotalRows}
            onBack={s.clearImportPreview}
            onConfirm={s.handleConfirmImport}
          />
        ) : null}
      </PolariaFormModal>

      <CompradorTableMultiPickerModal
        open={s.compradorPickerOpen}
        onClose={() => s.setCompradorPickerOpen(false)}
        rows={s.sortedCompradores}
        selectedCodigos={s.printCodigosComprador}
        onConfirm={s.setPrintCodigosComprador}
      />
    </>
  );
}
