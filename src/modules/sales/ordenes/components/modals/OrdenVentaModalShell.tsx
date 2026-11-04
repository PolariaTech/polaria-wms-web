"use client";

import { Loader2, Plus } from "lucide-react";
import type { FormEvent } from "react";
import { cn } from "@/lib/utils/cn";
import { formatPrecioEs } from "@/lib/utils/decimal-es";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { OrdenTrabajoPager } from "../orden-trabajo/OrdenTrabajoPager";
import { ovTieneIdParaCypher, puedeMostrarBotonCypher } from "../../utils/pedido/cypher-ov";
import { esperaDeOv } from "../../utils/pedido/espera-ov";
import { CargaConPolo } from "./OrdenVentaCorreccionCorreoPanel";
import { OrdenVentaFormFooterCenter } from "./OrdenVentaFormFooterCenter";
import { OrdenVentaFormFooterIconActions } from "./OrdenVentaFormFooterIconActions";
import {
  descriptionCreateModalOv,
  tituloCreateModalOv,
} from "./orden-venta-create-modal-cabecera";
import { OrdenVentaModalCuerpo, OrdenVentaModalOverlays, type OrdenVentaFormEstado } from "./OrdenVentaDiscrepanciasDialog";

export function OrdenVentaModalShell({ estado }: { estado: OrdenVentaFormEstado }) {
  return (
    <>
      {estado.showMateoLoading ? (
        <CargaConPolo {...esperaDeOv(estado)} />
      ) : null}

      <PolariaFormModal
        open={estado.open && !estado.showMateoLoading}
        onClose={estado.requestClose}
        scrollRegionRef={estado.formScrollRef}
        title={tituloCreateModalOv(estado)}
        description={descriptionCreateModalOv(estado)}
        onSubmit={(event) => {
          estado.submitIntentRef.current = "emit";
          void estado.handleSubmit(event);
        }}
        error={estado.step === "form" ? null : estado.error}
        isSubmitting={estado.isSaving}
        submitDisabled={
          estado.step === "preview" ||
          estado.step === "pickOt" ||
          estado.isLoading ||
          estado.isSaving ||
          !estado.hasProductos ||
          estado.lineas.length === 0 ||
          estado.hasCatalogPending
        }
        submitLabel={
          estado.isEditing &&
          estado.editingEstado !== "por_confirmar" &&
          !estado.pendingEmitId
            ? "Actualizar"
            : "Confirmar"
        }
        compact
        size={estado.step === "start" ? "lg" : "2xl"}
        layout={estado.cypherOpen && ovTieneIdParaCypher(estado) ? "dock-left" : "center"}
        closeOnBackdrop={false}
        hideHeaderClose
        headerCenter={
          estado.step === "form" && estado.paginarPorOt && estado.hijaFormActiva ? (
            <div className="min-w-0 max-w-full text-center">
              <p className="truncate polaria-text-body-sm font-semibold text-polaria-w">
                <span className="text-polaria-teal">
                  OT {estado.formOtSafePage + 1}/{estado.ordenesTrabajoForm.length}
                </span>
                <span className="mx-1.5 text-polaria-w-20">·</span>
                {estado.hijaFormActiva.almacen?.trim() || estado.hijaFormActiva.label}
              </p>
              <p className="truncate polaria-text-caption text-polaria-w-50">
                {estado.hijaFormActiva.numeroPedido?.trim()
                  ? `OC ${estado.hijaFormActiva.numeroPedido.trim()} · `
                  : null}
                Total OV ${formatPrecioEs(estado.totalOvCompleta)}
              </p>
            </div>
          ) : undefined
        }
        headerTrailing={
          !estado.cypherOpen && puedeMostrarBotonCypher(estado) && estado.onToggleCypher ? (
            <button
              type="button"
              title="Ver detalle Cypher"
              aria-label="Abrir detalle Cypher"
              onClick={() => estado.onToggleCypher()}
              className={cn(
                "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition",
                "border-polaria-t-20 bg-transparent text-polaria-teal hover:bg-polaria-t-08",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
              )}
            >
              <Plus className="h-4 w-4" strokeWidth={2.25} aria-hidden />
            </button>
          ) : undefined
        }
        asForm={estado.step === "form"}
        footerLeading={
          estado.step === "pickOt" ? (
            <></>
          ) : estado.step === "preview" && estado.previewHijas.length > 1 ? (
            <OrdenTrabajoPager
              page={estado.formOtSafePagePreview}
              total={estado.previewHijas.length}
              onPrev={() => estado.setFormOtPage((p: number) => Math.max(0, p - 1))}
              onNext={() =>
                estado.setFormOtPage((p: number) =>
                  Math.min(Math.max(estado.previewHijas.length - 1, 0), p + 1),
                )
              }
            />
          ) : estado.step === "form" && estado.paginarPorOt ? (
            <OrdenTrabajoPager
              page={estado.formOtSafePage}
              total={estado.ordenesTrabajoForm.length}
              label="Pedido OT"
              nextDisabled={estado.otPagerNextBlocked}
              nextDisabledHint="Completa los campos obligatorios (*) para continuar"
              onPrev={() => estado.goToOtPage(Math.max(0, estado.formOtSafePage - 1))}
              onNext={() =>
                estado.goToOtPage(
                  Math.min(estado.ordenesTrabajoForm.length - 1, estado.formOtSafePage + 1),
                )
              }
            />
          ) : undefined
        }
        footerCenter={
          <OrdenVentaFormFooterCenter
            step={estado.step}
            reagruparAplicada={estado.reagruparAplicada}
            onDeshacerReagrupacion={estado.handleDeshacerReagrupacion}
            error={estado.error}
            revisionPendiente={estado.revisionPendiente}
            confirmBloqueoReason={estado.confirmBloqueoReason}
            confirmSubmitDisabled={estado.confirmSubmitDisabled}
            paginarPorOt={estado.paginarPorOt}
            ordenesTrabajoCount={estado.ordenesTrabajoForm.length}
            formOtSafePage={estado.formOtSafePage}
            onGoToOtPage={estado.goToOtPage}
            onFocusRevision={estado.focusRevisionPendiente}
            onRequestRevisionFocus={(pendiente) => {
              estado.revisionFocusRequestRef.current = pendiente;
            }}
            onClearRevisionFocusRequest={() => {
              estado.revisionFocusRequestRef.current = null;
            }}
          />
        }
        footerBeforeCancel={
          estado.step === "form" ? (
            <OrdenVentaFormFooterIconActions
              showEliminar={Boolean(estado.hijaFormActiva)}
              indiceOt1Based={estado.formOtSafePage + 1}
              onEliminar={() => {
                if (estado.hijaFormActiva) estado.setConfirmRemoveOtId(estado.hijaFormActiva.id);
              }}
              onGuardarAvance={() => {
                estado.submitIntentRef.current = "draft";
                void estado.handleSubmit({
                  preventDefault() {},
                } as FormEvent<HTMLFormElement>);
              }}
              guardarDisabled={
                estado.isSaving ||
                estado.isLoading ||
                // Alta nueva: hace falta cliente o al menos un producto de catálogo.
                // OV existente: siempre se puede guardar avance (REQ-134).
                (!(estado.isEditing || estado.pendingEmitId) &&
                  !estado.idComprador &&
                  !estado.lineas.some(
                    (linea: { catalogPending?: boolean; idProducto?: string }) =>
                      !linea.catalogPending && Boolean(linea.idProducto),
                  ))
              }
              isSaving={estado.isSaving}
            />
          ) : undefined
        }
        footerAction={
          estado.step === "pickOt" ? (
            <></>
          ) : estado.step === "preview" ? (
            <button
              type="button"
              onClick={() => {
                estado.setFormOtPage(0);
                estado.setStep("form");
                estado.setError(null);
              }}
              className={cn(
                "rounded-xl bg-polaria-teal px-5 py-2.5",
                "polaria-text-body-sm font-semibold text-polaria-on-teal transition hover:opacity-90",
              )}
            >
              Continuar al formulario
            </button>
          ) : estado.step === "start" && estado.startMode === "docs" ? (
            <button
              type="button"
              onClick={() => {
                void estado.openFormFromDocs();
              }}
              disabled={!estado.docsReady || estado.isReadingIa}
              className={cn(
                "inline-flex min-w-[7rem] items-center justify-center gap-2 rounded-xl bg-polaria-teal px-5 py-2.5",
                "polaria-text-body-sm font-semibold text-polaria-on-teal transition hover:opacity-90",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              {estado.isReadingIa ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : null}
              Continuar
            </button>
          ) : estado.step === "start" ? (
            <></>
          ) : estado.step === "form" ? (
            <button
              type="submit"
              disabled={estado.confirmSubmitDisabled}
              title={
                estado.confirmSubmitDisabled
                  ? (estado.confirmBloqueoReason ?? "Completa lo pendiente para confirmar")
                  : undefined
              }
              aria-disabled={estado.confirmSubmitDisabled}
              className={cn(
                "inline-flex min-w-[7rem] items-center justify-center gap-2 rounded-xl bg-polaria-teal px-4 py-2.5",
                "polaria-text-body-sm font-semibold text-polaria-on-teal transition hover:opacity-90",
                "disabled:cursor-not-allowed disabled:opacity-60",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
              )}
            >
              {estado.isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : null}
              {estado.isEditing &&
              estado.editingEstado !== "por_confirmar" &&
              !estado.pendingEmitId
                ? "Actualizar"
                : "Confirmar"}
            </button>
          ) : undefined
        }
        closeOnEscape={
          estado.picker === null &&
          !estado.isCompradorCreateOpen &&
          !estado.confirmDiscrepanciasOpen &&
          !estado.confirmSaveOpen &&
          !estado.confirmDiscardOpen &&
          !estado.addOtOpen &&
          !estado.confirmRemoveOtId
        }
        submitOnEnter={false}
      >
        <OrdenVentaModalCuerpo estado={estado} />
      </PolariaFormModal>
      <OrdenVentaModalOverlays estado={estado} />
    </>
  );
}
