"use client";

import { PolariaStatusLoading } from "@/components/shared/status/PolariaStatusLoading";
import { cn } from "@/lib/utils/cn";
import { cypherPanelWidthClass } from "../../constants/cypher-layout";
import { OrdenVentaCypherStagesBody } from "./OrdenVentaCypherStagesBody";
import { OrdenVentaCypherDrawerChrome } from "./OrdenVentaCypherDrawerChrome";
import { OrdenVentaCypherDrawerFooter } from "./OrdenVentaCypherDrawerFooter";
import { OrdenVentaCypherDrawerDialogs } from "./OrdenVentaCypherDrawerDialogs";
import type { OrdenVentaCypherDrawerProps } from "./cypher-drawer-props";
import { useOrdenVentaCypherDrawerContent } from "./use-orden-venta-cypher-drawer-content";

export function OrdenVentaCypherDrawerContent(props: OrdenVentaCypherDrawerProps) {
  const {
    titleId,
    scrollRef,
    stageNavRef,
    orden,
    codigoCuenta,
    companionIdComprador,
    zonaHoraria,
    confirmBorrarOpen,
    setConfirmBorrarOpen,
    borrarError,
    setBorrarError,
    cypherWidthMode,
    isResizingWidth,
    handleResizePointerDown,
    handleResizePointerMove,
    handleResizePointerUp,
    panelMounted,
    panelEntered,
    isLoading,
    error,
    activeStage,
    openStages,
    scrollToStage,
    toggleAccordionStage,
    hijasFromOrden,
    activeOtPicker,
    idOrdenTrabajoBitacora,
    logEntries,
    logLoading,
    cuerpoCompleto,
    cuerpoMensaje,
    correoChrome,
    origenAdjuntosStored,
    emlInnerAdjuntos,
    emlInnerLoading,
    origenAdjuntos,
    origenNombres,
    estado,
    estadosSuperiores,
    estadoCambiando,
    estadoPendiente,
    setEstadoPendiente,
    cambioEstadoError,
    setCambioEstadoError,
    cambiarEstado,
    codigo,
    comprador,
    occ,
    recibida,
    lineas,
    puedeEditar,
    puedeAlmacen,
    puedeBorrar,
    bloqueadoHastaConfirmar,
    onFotos,
    companionWithEdit,
    onClose,
    inspect,
    row,
  } = useOrdenVentaCypherDrawerContent(props);
  const { busyKind, onEdit, onPrint, onPreview, onBorrar } = props;

  if (!panelMounted) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 top-[var(--polaria-shell-top,4.75rem)] z-[110]"
      role="presentation"
    >
      <aside
        role="dialog"
        aria-modal={companionWithEdit}
        aria-labelledby={titleId}
        className={cn(
          "pointer-events-auto absolute inset-y-0 right-0 flex h-full max-h-full min-w-0 flex-col overflow-hidden",
          "border-l border-t border-polaria-t-20 bg-polaria-bg shadow-[-20px_0_40px_rgba(0,0,0,0.35)]",
          "box-border will-change-transform",
          "@container/cypher",
          isResizingWidth
            ? "transition-transform duration-[320ms] ease-out"
            : "transition-[transform,width,max-width] duration-[320ms] ease-out",
          cypherPanelWidthClass(cypherWidthMode),
          panelEntered ? "translate-x-0" : "translate-x-full",
        )}
      >
        <OrdenVentaCypherDrawerChrome
          titleId={titleId}
          codigo={codigo}
          comprador={comprador}
          occ={occ}
          recibida={recibida}
          estado={estado}
          onClose={onClose}
          stageNavRef={stageNavRef}
          activeStage={activeStage}
          scrollToStage={scrollToStage}
          isResizingWidth={isResizingWidth}
          handleResizePointerDown={handleResizePointerDown}
          handleResizePointerMove={handleResizePointerMove}
          handleResizePointerUp={handleResizePointerUp}
        />

        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-3 pb-8 pt-1 sm:px-4"
        >
          {isLoading ? <PolariaStatusLoading embedded className="py-10" /> : null}

          {error ? (
            <p
              role="alert"
              className="mt-6 rounded-xl border border-polaria-danger-border bg-polaria-danger-bg px-4 py-3 polaria-text-body-sm text-polaria-danger"
            >
              {error}
            </p>
          ) : null}

          {!isLoading && !error && orden && codigoCuenta ? (
            <OrdenVentaCypherStagesBody
              orden={orden}
              codigoCuenta={codigoCuenta}
              codigoOvListado={row?.venta ?? orden.codigo}
              correoPartido={row?.correoPartido}
              correoPartidoDe={row?.correoPartidoDe}
              companionIdComprador={companionIdComprador}
              openStages={openStages}
              toggleAccordionStage={toggleAccordionStage}
              correoChrome={correoChrome}
              origenNombres={origenNombres}
              recibida={recibida}
              cuerpoCompleto={cuerpoCompleto}
              cuerpoMensaje={cuerpoMensaje}
              origenAdjuntosStored={origenAdjuntosStored}
              emlInnerAdjuntos={emlInnerAdjuntos}
              emlInnerLoading={emlInnerLoading}
              origenAdjuntos={origenAdjuntos}
              activeOtPicker={activeOtPicker}
              estado={estado}
              comprador={comprador}
              occ={occ}
              zonaHoraria={zonaHoraria}
              lineas={lineas}
              hijasFromOrden={hijasFromOrden}
              puedeAlmacen={puedeAlmacen}
              onFotos={onFotos}
              estadosSuperiores={estadosSuperiores}
              estadoCambiando={estadoCambiando}
              setCambioEstadoError={setCambioEstadoError}
              setEstadoPendiente={setEstadoPendiente}
              logLoading={logLoading}
              logEntries={logEntries}
              idOrdenTrabajoBitacora={idOrdenTrabajoBitacora}
            />
          ) : null}
        </div>

        {!inspect && row && row.estado !== "cancelada" ? (
          <OrdenVentaCypherDrawerFooter
            puedeEditar={puedeEditar}
            puedeAlmacen={puedeAlmacen}
            puedeBorrar={puedeBorrar}
            bloqueadoHastaConfirmar={bloqueadoHastaConfirmar}
            busyKind={busyKind}
            onEdit={onEdit}
            onPrint={onPrint}
            onPreview={onPreview}
            onBorrar={onBorrar}
            onOpenBorrarConfirm={() => {
              setBorrarError(null);
              setConfirmBorrarOpen(true);
            }}
          />
        ) : null}
      </aside>

      <OrdenVentaCypherDrawerDialogs
        confirmBorrarOpen={confirmBorrarOpen}
        busyKind={busyKind}
        borrarError={borrarError}
        onCloseBorrar={() => {
          if (busyKind === "borrar") return;
          setConfirmBorrarOpen(false);
          setBorrarError(null);
        }}
        onConfirmBorrar={() => {
          if (!onBorrar || busyKind === "borrar") return;
          setBorrarError(null);
          void Promise.resolve(onBorrar())
            .then(() => {
              setConfirmBorrarOpen(false);
            })
            .catch((err: unknown) => {
              setBorrarError(
                err instanceof Error ? err.message : "No se pudo borrar la orden.",
              );
            });
        }}
        estadoPendiente={estadoPendiente}
        estadoCambiando={estadoCambiando}
        cambioEstadoError={cambioEstadoError}
        onCloseEstado={() => {
          if (estadoCambiando) return;
          setEstadoPendiente(null);
          setCambioEstadoError(null);
        }}
        onConfirmEstado={() => {
          if (!estadoPendiente || estadoCambiando) return;
          cambiarEstado(estadoPendiente);
        }}
      />
    </div>
  );
}
