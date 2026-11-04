"use client";

import { PolariaStatusLoading } from "@/components/shared/status/PolariaStatusLoading";
import { OrdenVentaFormStep } from "./OrdenVentaFormToolbar";
import { OrdenVentaCapturePickOt, OrdenVentaModalPickers } from "./OrdenVentaCapturePickOt";
import { OrdenVentaCapturePreview, OrdenVentaModalDialogs } from "./OrdenVentaCapturePreview";
import { OrdenVentaCaptureStart } from "./OrdenVentaCaptureStart";
import { fieldControlClass } from "../../utils/pedido/orden-venta-create-helpers";
import type { OrdenVentaFormEstado } from "../../types/orden-venta-form-estado";

export type { OrdenVentaFormEstado };

export function OrdenVentaModalCuerpo({ estado }: { estado: OrdenVentaFormEstado }) {
  return (
    <>
        {estado.isLoading &&
        (estado.isEditing || estado.step !== "start" || estado.startMode === "scratch") ? (
          <PolariaStatusLoading embedded className="py-4" />
        ) : null}

        <OrdenVentaCaptureStart
          showChoices={
            estado.step === "start" &&
            estado.startMode !== "docs" &&
            !(estado.startMode === "scratch" && estado.isLoading)
          }
          showDocs={estado.step === "start" && estado.startMode === "docs"}
          startMode={estado.startMode}
          isEditing={estado.isEditing}
          onFirstTime={estado.openFirstTimeFlow}
          onScratch={estado.openFormFromScratch}
          onDocs={() => {
            estado.setStartMode("docs");
            estado.setError(null);
          }}
          onBack={() => {
            estado.setStartMode(null);
            estado.setError(null);
          }}
          compradorLabel={estado.compradorLabel}
          clienteControlClass={fieldControlClass({
            field: "cliente",
            missingFields: estado.missingFields,
          })}
          onSearchCliente={() => estado.setPicker("comprador")}
          showClientePendiente={
            !estado.idComprador &&
            (Boolean(estado.compradorNombreIa) || estado.compradorSugerencias.length > 0)
          }
          origenTexto={estado.origenTexto}
          onOrigenTexto={estado.setOrigenTexto}
          origenArchivoFiles={estado.origenArchivoFiles}
          isDocsDropActive={estado.isDocsDropActive}
          docsFileInputRef={estado.docsFileInputRef}
          onDragOver={(event) => {
            event.preventDefault();
            estado.setIsDocsDropActive(true);
          }}
          onDragLeave={() => estado.setIsDocsDropActive(false)}
          onDrop={(event) => {
            event.preventDefault();
            estado.setIsDocsDropActive(false);
            estado.appendDocsFiles(event.dataTransfer.files);
          }}
          onFilesSelected={estado.appendDocsFiles}
          onRemoveFile={(file: File) =>
            estado.setOrigenArchivoFiles((prev: File[]) =>
              prev.filter(
                (item) => !(item.name === file.name && item.size === file.size),
              ),
            )
          }
          docsHasContent={estado.docsHasContent}
        />

        {estado.step === "preview" && !estado.isLoading ? (
          <OrdenVentaCapturePreview
            clienteLabel={estado.compradorLabel}
            hijas={estado.previewHijas}
            page={estado.formOtSafePagePreview}
            onRemoveHija={(hijaId) => estado.setConfirmRemoveOtId(hijaId)}
            onAddTarea={() => {
              estado.setAddOtAlmacen("");
              estado.setAddOtNumeroPedido(estado.ordenCompraHotel.trim());
              estado.setAddOtOpen(true);
              estado.setError(null);
            }}
          />
        ) : null}

        {estado.step === "pickOt" && !estado.isLoading ? (
          <OrdenVentaCapturePickOt
            cypherOpen={estado.cypherOpen}
            hijas={estado.ordenesTrabajoForm}
            onEdit={(index: number) => {
              estado.setFormOtPage(index);
              estado.setStep("form");
              estado.setError(null);
            }}
            onRemove={(hijaId) => estado.setConfirmRemoveOtId(hijaId)}
            onAddTarea={() => {
              estado.setAddOtAlmacen("");
              estado.setAddOtNumeroPedido(estado.ordenCompraHotel.trim());
              estado.setAddOtOpen(true);
              estado.setError(null);
            }}
          />
        ) : null}

        {estado.step === "form" && !estado.isLoading ? (
          <OrdenVentaFormStep {...estado} />
        ) : null}
    </>
  );
}

export function OrdenVentaModalOverlays({ estado }: { estado: OrdenVentaFormEstado }) {
  return (
    <>
      <OrdenVentaModalPickers
        picker={estado.picker}
        pendingEmitId={estado.pendingEmitId}
        setPicker={estado.setPicker}
        compradores={estado.compradores}
        compradorPickerPriorityIds={estado.compradorPickerPriorityIds}
        idComprador={estado.idComprador}
        handleSelectComprador={estado.handleSelectComprador}
        compradorNombreIa={estado.compradorNombreIa}
        compradorSugerencias={estado.compradorSugerencias}
        cypherOpen={estado.cypherOpen}
        isEditing={estado.isEditing}
        productosParaPicker={estado.productosParaPicker}
        productoPickerPriorityIds={estado.productoPickerPriorityIds}
        replaceLineaIndex={estado.replaceLineaIndex}
        setReplaceLineaIndex={estado.setReplaceLineaIndex}
        lineas={estado.lineas}
        handleSelectProducto={estado.handleSelectProducto}
        handleAcceptSugerencia={estado.handleAcceptSugerencia}
        handleOpenReplaceProducto={estado.handleOpenReplaceProducto}
        moneda={estado.moneda}
        setMoneda={estado.setMoneda}
        bodegasDestino={estado.bodegasDestino}
        idBodegaDestino={estado.idBodegaDestino}
        setIdBodegaDestino={estado.setIdBodegaDestino}
        isCompradorCreateOpen={estado.isCompradorCreateOpen}
        setIsCompradorCreateOpen={estado.setIsCompradorCreateOpen}
        startMode={estado.startMode}
        step={estado.step}
        setStartMode={estado.setStartMode}
        handleCompradorCreatedForSale={estado.handleCompradorCreatedForSale}
      />
      <OrdenVentaModalDialogs
        confirmDiscrepanciasOpen={estado.confirmDiscrepanciasOpen}
        setConfirmDiscrepanciasOpen={estado.setConfirmDiscrepanciasOpen}
        skipDiscrepanciaConfirmRef={estado.skipDiscrepanciaConfirmRef}
        skipSaveConfirmRef={estado.skipSaveConfirmRef}
        handleSubmit={estado.handleSubmit}
        avisosValidacion={estado.avisosValidacion}
        canReemplazarDiscrepancia={estado.canReemplazarDiscrepancia}
        handleReemplazarDiscrepancia={estado.handleReemplazarDiscrepancia}
        confirmSaveOpen={estado.confirmSaveOpen}
        setConfirmSaveOpen={estado.setConfirmSaveOpen}
        esPorConfirmar={estado.esPorConfirmar}
        fechaEntrega={estado.fechaEntrega}
        setMissingFields={estado.setMissingFields}
        setError={estado.setError}
        isEditing={estado.isEditing}
        editingEstado={estado.editingEstado}
        fechaEntregaAtrasada={estado.fechaEntregaAtrasada}
        avisoPotencialDuplicado={estado.avisoPotencialDuplicado}
        confirmDiscardOpen={estado.confirmDiscardOpen}
        setConfirmDiscardOpen={estado.setConfirmDiscardOpen}
        onClose={estado.onClose}
        ordenesTrabajoForm={estado.ordenesTrabajoForm}
        confirmRemoveOtId={estado.confirmRemoveOtId}
        setConfirmRemoveOtId={estado.setConfirmRemoveOtId}
        handleConfirmRemoveOrdenTrabajo={estado.handleConfirmRemoveOrdenTrabajo}
        addOtOpen={estado.addOtOpen}
        setAddOtOpen={estado.setAddOtOpen}
        addOtAlmacen={estado.addOtAlmacen}
        setAddOtAlmacen={estado.setAddOtAlmacen}
        addOtNumeroPedido={estado.addOtNumeroPedido}
        setAddOtNumeroPedido={estado.setAddOtNumeroPedido}
        handleAddOrdenTrabajo={estado.handleAddOrdenTrabajo}
        reagruparOpen={estado.reagruparOpen}
        cypherOpen={estado.cypherOpen}
        editingId={estado.editingId}
        folioVisible={estado.folioVisible}
        setReagruparOpen={estado.setReagruparOpen}
        obtenerSolicitudReagrupacion={estado.obtenerSolicitudReagrupacion}
        handleAplicarReagrupacion={estado.handleAplicarReagrupacion}
        handleAplicarCorreccionCorreo={estado.handleAplicarCorreccionCorreo}
      />
    </>
  );
}
