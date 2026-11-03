"use client";

import { PolariaStatusLoading } from "@/components/shared/status/PolariaStatusLoading";
import { OrdenVentaFormStep } from "./OrdenVentaFormToolbar";
import { OrdenVentaCapturePickOt, OrdenVentaModalPickers } from "./OrdenVentaCapturePickOt";
import { OrdenVentaCapturePreview, OrdenVentaModalDialogs } from "./OrdenVentaCapturePreview";
import { OrdenVentaCaptureStart } from "./OrdenVentaCaptureStart";
import { fieldControlClass } from "../../utils/pedido/orden-venta-create-helpers";

export function OrdenVentaModalCuerpo({ e }: { e: Record<string, any> }) {
  return (
    <>
        {e.isLoading &&
        (e.isEditing || e.step !== "start" || e.startMode === "scratch") ? (
          <PolariaStatusLoading embedded className="py-4" />
        ) : null}

        <OrdenVentaCaptureStart
          showChoices={
            e.step === "start" &&
            e.startMode !== "docs" &&
            !(e.startMode === "scratch" && e.isLoading)
          }
          showDocs={e.step === "start" && e.startMode === "docs"}
          startMode={e.startMode}
          isEditing={e.isEditing}
          onFirstTime={e.openFirstTimeFlow}
          onScratch={e.openFormFromScratch}
          onDocs={() => {
            e.setStartMode("docs");
            e.setError(null);
          }}
          onBack={() => {
            e.setStartMode(null);
            e.setError(null);
          }}
          compradorLabel={e.compradorLabel}
          clienteControlClass={fieldControlClass({
            field: "cliente",
            missingFields: e.missingFields,
          })}
          onSearchCliente={() => e.setPicker("comprador")}
          showClientePendiente={
            !e.idComprador &&
            (Boolean(e.compradorNombreIa) || e.compradorSugerencias.length > 0)
          }
          origenTexto={e.origenTexto}
          onOrigenTexto={e.setOrigenTexto}
          origenArchivoFiles={e.origenArchivoFiles}
          isDocsDropActive={e.isDocsDropActive}
          docsFileInputRef={e.docsFileInputRef}
          onDragOver={(event) => {
            event.preventDefault();
            e.setIsDocsDropActive(true);
          }}
          onDragLeave={() => e.setIsDocsDropActive(false)}
          onDrop={(event) => {
            event.preventDefault();
            e.setIsDocsDropActive(false);
            e.appendDocsFiles(event.dataTransfer.files);
          }}
          onFilesSelected={e.appendDocsFiles}
          onRemoveFile={(file: File) =>
            e.setOrigenArchivoFiles((prev: File[]) =>
              prev.filter(
                (item) => !(item.name === file.name && item.size === file.size),
              ),
            )
          }
          docsHasContent={e.docsHasContent}
        />

        {e.step === "preview" && !e.isLoading ? (
          <OrdenVentaCapturePreview
            clienteLabel={e.compradorLabel}
            hijas={e.previewHijas}
            page={e.formOtSafePagePreview}
            onRemoveHija={(hijaId) => e.setConfirmRemoveOtId(hijaId)}
            onAddTarea={() => {
              e.setAddOtAlmacen("");
              e.setAddOtNumeroPedido(e.ordenCompraHotel.trim());
              e.setAddOtOpen(true);
              e.setError(null);
            }}
          />
        ) : null}

        {e.step === "pickOt" && !e.isLoading ? (
          <OrdenVentaCapturePickOt
            cypherOpen={e.cypherOpen}
            hijas={e.ordenesTrabajoForm}
            onEdit={(index: number) => {
              e.setFormOtPage(index);
              e.setStep("form");
              e.setError(null);
            }}
            onRemove={(hijaId) => e.setConfirmRemoveOtId(hijaId)}
            onAddTarea={() => {
              e.setAddOtAlmacen("");
              e.setAddOtNumeroPedido(e.ordenCompraHotel.trim());
              e.setAddOtOpen(true);
              e.setError(null);
            }}
          />
        ) : null}

        {e.step === "form" && !e.isLoading ? (
          <OrdenVentaFormStep
            ordenesTrabajoForm={e.ordenesTrabajoForm}
            hijaFormActiva={e.hijaFormActiva}
            setConfirmRemoveOtId={e.setConfirmRemoveOtId}
            isEditing={e.isEditing}
            setStep={e.setStep}
            setStartMode={e.setStartMode}
            setError={e.setError}
            afterCutoff={e.afterCutoff}
            successMessage={e.successMessage}
            hasProductos={e.hasProductos}
            emptyCatalogMessage={e.emptyCatalogMessage}
            startMode={e.startMode}
            origenTexto={e.origenTexto}
            origenArchivosNombres={e.origenArchivosNombres}
            vendedorNombre={e.vendedorNombre}
            idComprador={e.idComprador}
            compradorLabel={e.compradorLabel}
            compradorNombreIa={e.compradorNombreIa}
            compradorSugerencias={e.compradorSugerencias}
            missingFields={e.missingFields}
            setPicker={e.setPicker}
            codigoClienteCatalogo={e.codigoClienteCatalogo}
            denominacionComercialCatalogo={e.denominacionComercialCatalogo}
            fechaCreacion={e.fechaCreacion}
            paginarPorOt={e.paginarPorOt}
            folioFactura={e.folioFactura}
            ordenCompraHotel={e.ordenCompraHotel}
            setOrdenCompraHotel={e.setOrdenCompraHotel}
            exigeOc={e.exigeOc}
            centroConsumo={e.centroConsumo}
            setCentroConsumo={e.setCentroConsumo}
            fechaEntrega={e.fechaEntrega}
            setFechaEntrega={e.setFechaEntrega}
            esPorConfirmar={e.esPorConfirmar}
            ventanaDesde={e.ventanaDesde}
            setVentanaDesde={e.setVentanaDesde}
            ventanaHasta={e.ventanaHasta}
            setVentanaHasta={e.setVentanaHasta}
            prioridad={e.prioridad}
            setPrioridad={e.setPrioridad}
            moneda={e.moneda}
            observaciones={e.observaciones}
            setObservaciones={e.setObservaciones}
            clearFieldMarks={e.clearFieldMarks}
            autoFields={e.autoFields}
            warnFields={e.warnFields}
            direccion={e.direccion}
            setDireccion={e.setDireccion}
            setAvisoVerificarDireccion={e.setAvisoVerificarDireccion}
            avisoVerificarDireccion={e.avisoVerificarDireccion}
            contacto={e.contacto}
            setContacto={e.setContacto}
            telefono={e.telefono}
            setTelefono={e.setTelefono}
            correo={e.correo}
            setCorreo={e.setCorreo}
            lineasConIndice={e.lineasConIndice}
            subtotalVenta={e.subtotalVenta}
            ivaVenta={e.ivaVenta}
            totalVenta={e.totalVenta}
            totalOvCompleta={e.totalOvCompleta}
            mostrarTotalOv={e.mostrarTotalOv}
            puedeAgregarProducto={e.puedeAgregarProducto}
            setReplaceLineaIndex={e.setReplaceLineaIndex}
            handleOpenReplaceProducto={e.handleOpenReplaceProducto}
            handleLineaFieldChange={e.handleLineaFieldChange}
            handleCantidadChange={e.handleCantidadChange}
            handleCantidadBlur={e.handleCantidadBlur}
            handlePrecioChange={e.handlePrecioChange}
            handlePrecioBlur={e.handlePrecioBlur}
            handleRemoveLinea={e.handleRemoveLinea}
            lineas={e.lineas}
            setLineas={e.setLineas}
            aceptaSustituciones={e.aceptaSustituciones}
            setAceptaSustituciones={e.setAceptaSustituciones}
            requiereLote={e.requiereLote}
            setRequiereLote={e.setRequiereLote}
            registrarTemperatura={e.registrarTemperatura}
            setRegistrarTemperatura={e.setRegistrarTemperatura}
          />
        ) : null}
    </>
  );
}

export function OrdenVentaModalOverlays({ e }: { e: Record<string, any> }) {
  return (
    <>
      <OrdenVentaModalPickers
        picker={e.picker}
        setPicker={e.setPicker}
        compradores={e.compradores}
        compradorPickerPriorityIds={e.compradorPickerPriorityIds}
        idComprador={e.idComprador}
        handleSelectComprador={e.handleSelectComprador}
        compradorNombreIa={e.compradorNombreIa}
        compradorSugerencias={e.compradorSugerencias}
        cypherOpen={e.cypherOpen}
        isEditing={e.isEditing}
        productosParaPicker={e.productosParaPicker}
        productoPickerPriorityIds={e.productoPickerPriorityIds}
        replaceLineaIndex={e.replaceLineaIndex}
        setReplaceLineaIndex={e.setReplaceLineaIndex}
        lineas={e.lineas}
        handleSelectProducto={e.handleSelectProducto}
        handleAcceptSugerencia={e.handleAcceptSugerencia}
        handleOpenReplaceProducto={e.handleOpenReplaceProducto}
        moneda={e.moneda}
        setMoneda={e.setMoneda}
        bodegasDestino={e.bodegasDestino}
        idBodegaDestino={e.idBodegaDestino}
        setIdBodegaDestino={e.setIdBodegaDestino}
        isCompradorCreateOpen={e.isCompradorCreateOpen}
        setIsCompradorCreateOpen={e.setIsCompradorCreateOpen}
        startMode={e.startMode}
        step={e.step}
        setStartMode={e.setStartMode}
        handleCompradorCreatedForSale={e.handleCompradorCreatedForSale}
      />
      <OrdenVentaModalDialogs
        confirmDiscrepanciasOpen={e.confirmDiscrepanciasOpen}
        setConfirmDiscrepanciasOpen={e.setConfirmDiscrepanciasOpen}
        skipDiscrepanciaConfirmRef={e.skipDiscrepanciaConfirmRef}
        skipSaveConfirmRef={e.skipSaveConfirmRef}
        handleSubmit={e.handleSubmit}
        avisosValidacion={e.avisosValidacion}
        canReemplazarDiscrepancia={e.canReemplazarDiscrepancia}
        handleReemplazarDiscrepancia={e.handleReemplazarDiscrepancia}
        confirmSaveOpen={e.confirmSaveOpen}
        setConfirmSaveOpen={e.setConfirmSaveOpen}
        esPorConfirmar={e.esPorConfirmar}
        fechaEntrega={e.fechaEntrega}
        setMissingFields={e.setMissingFields}
        setError={e.setError}
        isEditing={e.isEditing}
        editingEstado={e.editingEstado}
        fechaEntregaAtrasada={e.fechaEntregaAtrasada}
        avisoPotencialDuplicado={e.avisoPotencialDuplicado}
        confirmDiscardOpen={e.confirmDiscardOpen}
        setConfirmDiscardOpen={e.setConfirmDiscardOpen}
        onClose={e.onClose}
        ordenesTrabajoForm={e.ordenesTrabajoForm}
        confirmRemoveOtId={e.confirmRemoveOtId}
        setConfirmRemoveOtId={e.setConfirmRemoveOtId}
        handleConfirmRemoveOrdenTrabajo={e.handleConfirmRemoveOrdenTrabajo}
        addOtOpen={e.addOtOpen}
        setAddOtOpen={e.setAddOtOpen}
        addOtAlmacen={e.addOtAlmacen}
        setAddOtAlmacen={e.setAddOtAlmacen}
        addOtNumeroPedido={e.addOtNumeroPedido}
        setAddOtNumeroPedido={e.setAddOtNumeroPedido}
        handleAddOrdenTrabajo={e.handleAddOrdenTrabajo}
        reagruparOpen={e.reagruparOpen}
        cypherOpen={e.cypherOpen}
        editingId={e.editingId}
        folioVisible={e.folioVisible}
        setReagruparOpen={e.setReagruparOpen}
        obtenerSolicitudReagrupacion={e.obtenerSolicitudReagrupacion}
        handleAplicarReagrupacion={e.handleAplicarReagrupacion}
        handleAplicarCorreccionCorreo={e.handleAplicarCorreccionCorreo}
      />
    </>
  );
}
