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
  const drawer = useOrdenVentaCypherDrawerContent(props);
  const { busyKind, onEdit, onPrint, onPreview, onBorrar } = props;

  if (!drawer.panelMounted) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 top-[var(--polaria-shell-top,4.75rem)] z-[110]"
      role="presentation"
    >
      <aside
        role="dialog"
        aria-modal={drawer.companionWithEdit}
        aria-labelledby={drawer.titleId}
        className={cn(
          "pointer-events-auto absolute inset-y-0 right-0 flex h-full max-h-full min-w-0 flex-col overflow-hidden",
          "border-l border-t border-polaria-t-20 bg-polaria-bg shadow-[-20px_0_40px_rgba(0,0,0,0.35)]",
          "box-border will-change-transform",
          "@container/cypher",
          drawer.isResizingWidth
            ? "transition-transform duration-[320ms] ease-out"
            : "transition-[transform,width,max-width] duration-[320ms] ease-out",
          cypherPanelWidthClass(drawer.cypherWidthMode),
          drawer.panelEntered ? "translate-x-0" : "translate-x-full",
        )}
      >
        <OrdenVentaCypherDrawerChrome
          titleId={drawer.titleId}
          codigo={drawer.codigo}
          comprador={drawer.comprador}
          occ={drawer.occ}
          recibida={drawer.recibida}
          estado={drawer.estado}
          onClose={drawer.onClose}
          stageNavRef={drawer.stageNavRef}
          activeStage={drawer.activeStage}
          scrollToStage={drawer.scrollToStage}
          isResizingWidth={drawer.isResizingWidth}
          handleResizePointerDown={drawer.handleResizePointerDown}
          handleResizePointerMove={drawer.handleResizePointerMove}
          handleResizePointerUp={drawer.handleResizePointerUp}
        />

        <div
          ref={drawer.scrollRef}
          className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-3 pb-8 pt-1 sm:px-4"
        >
          {drawer.isLoading ? <PolariaStatusLoading embedded className="py-10" /> : null}

          {drawer.error ? (
            <p
              role="alert"
              className="mt-6 rounded-xl border border-polaria-danger-border bg-polaria-danger-bg px-4 py-3 polaria-text-body-sm text-polaria-danger"
            >
              {drawer.error}
            </p>
          ) : null}

          {!drawer.isLoading && !drawer.error && drawer.orden && drawer.codigoCuenta ? (
            <OrdenVentaCypherStagesBody
              orden={drawer.orden}
              codigoCuenta={drawer.codigoCuenta}
              companionIdComprador={drawer.companionIdComprador}
              openStages={drawer.openStages}
              toggleAccordionStage={drawer.toggleAccordionStage}
              correoChrome={drawer.correoChrome}
              origenNombres={drawer.origenNombres}
              recibida={drawer.recibida}
              cuerpoCompleto={drawer.cuerpoCompleto}
              cuerpoMensaje={drawer.cuerpoMensaje}
              origenAdjuntosStored={drawer.origenAdjuntosStored}
              emlInnerAdjuntos={drawer.emlInnerAdjuntos}
              emlInnerLoading={drawer.emlInnerLoading}
              origenAdjuntos={drawer.origenAdjuntos}
              activeOtPicker={drawer.activeOtPicker}
              estado={drawer.estado}
              comprador={drawer.comprador}
              occ={drawer.occ}
              zonaHoraria={drawer.zonaHoraria}
              lineas={drawer.lineas}
              hijasFromOrden={drawer.hijasFromOrden}
              puedeAlmacen={drawer.puedeAlmacen}
              onFotos={drawer.onFotos}
              estadosSuperiores={drawer.estadosSuperiores}
              estadoCambiando={drawer.estadoCambiando}
              setCambioEstadoError={drawer.setCambioEstadoError}
              setEstadoPendiente={drawer.setEstadoPendiente}
              logLoading={drawer.logLoading}
              logEntries={drawer.logEntries}
              idOrdenTrabajoBitacora={drawer.idOrdenTrabajoBitacora}
            />
          ) : null}
        </div>

        {!drawer.inspect && drawer.row && drawer.row.estado !== "cancelada" ? (
          <OrdenVentaCypherDrawerFooter
            puedeEditar={drawer.puedeEditar}
            puedeAlmacen={drawer.puedeAlmacen}
            puedeBorrar={drawer.puedeBorrar}
            bloqueadoHastaConfirmar={drawer.bloqueadoHastaConfirmar}
            busyKind={busyKind}
            onEdit={onEdit}
            onPrint={onPrint}
            onPreview={onPreview}
            onBorrar={onBorrar}
            onOpenBorrarConfirm={() => {
              drawer.setBorrarError(null);
              drawer.setConfirmBorrarOpen(true);
            }}
          />
        ) : null}
      </aside>

      <OrdenVentaCypherDrawerDialogs
        confirmBorrarOpen={drawer.confirmBorrarOpen}
        busyKind={busyKind}
        borrarError={drawer.borrarError}
        onCloseBorrar={() => {
          if (busyKind === "borrar") return;
          drawer.setConfirmBorrarOpen(false);
          drawer.setBorrarError(null);
        }}
        onConfirmBorrar={() => {
          if (!onBorrar || busyKind === "borrar") return;
          drawer.setBorrarError(null);
          void Promise.resolve(onBorrar())
            .then(() => {
              drawer.setConfirmBorrarOpen(false);
            })
            .catch((err: unknown) => {
              drawer.setBorrarError(
                err instanceof Error ? err.message : "No se pudo borrar la orden.",
              );
            });
        }}
        estadoPendiente={drawer.estadoPendiente}
        estadoCambiando={drawer.estadoCambiando}
        cambioEstadoError={drawer.cambioEstadoError}
        onCloseEstado={() => {
          if (drawer.estadoCambiando) return;
          drawer.setEstadoPendiente(null);
          drawer.setCambioEstadoError(null);
        }}
        onConfirmEstado={() => {
          if (!drawer.estadoPendiente || drawer.estadoCambiando) return;
          drawer.cambiarEstado(drawer.estadoPendiente);
        }}
      />
    </div>
  );
}
