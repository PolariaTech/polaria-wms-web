"use client";

import { Loader2, Plus, Save } from "lucide-react";
import type { FormEvent } from "react";
import { cn } from "@/lib/utils/cn";
import { formatPrecioEs } from "@/lib/utils/decimal-es";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { MateoIaLoadingScreen } from "@/components/mateo/MateoIaLoadingScreen";
import { OrdenTrabajoPager } from "../orden-trabajo/OrdenTrabajoPager";
import { OrdenVentaFormFooterCenter } from "./OrdenVentaFormFooterCenter";
import { OrdenVentaModalCuerpo, OrdenVentaModalOverlays } from "./OrdenVentaDiscrepanciasDialog";

export function OrdenVentaModalShell({ e }: { e: Record<string, any> }) {
  return (
    <>
      {e.showMateoLoading ? (
        <MateoIaLoadingScreen message={e.mateoBusyMessage} />
      ) : null}

      <PolariaFormModal
        open={e.open && !e.showMateoLoading}
        onClose={e.requestClose}
        scrollRegionRef={e.formScrollRef}
        title={
          e.isEditing && e.step === "pickOt"
            ? "Órdenes de trabajo"
            : e.isEditing
              ? e.folioVisible
                ? `Editar · ${e.folioVisible}`
                : "Editar pedido"
              : e.step === "form"
                ? e.folioVisible
                  ? `Pedido · ${e.folioVisible}`
                  : "Pedido"
                : e.step === "preview"
                  ? "Órdenes de trabajo detectadas"
                  : "Nuevo pedido"
        }
        description={
          e.isEditing && e.step === "pickOt"
            ? "Elige qué orden de trabajo quieres editar"
            : e.isEditing
              ? e.folioVisible
                ? `Folio ${e.folioVisible} — actualiza los datos del pedido`
                : "Actualiza los datos del pedido"
              : e.step === "form"
                ? e.formDescription
                : e.step === "preview"
                  ? "Previsualización antes de confirmar el formulario"
                  : e.startMode === "docs"
                    ? "Mateo lee el mensaje o los archivos del pedido"
                    : "¿Cómo quieres empezar?"
        }
        onSubmit={(event) => {
          e.submitIntentRef.current = "emit";
          void e.handleSubmit(event);
        }}
        error={e.step === "form" ? null : e.error}
        isSubmitting={e.isSaving}
        submitDisabled={
          e.step === "preview" ||
          e.step === "pickOt" ||
          e.isLoading ||
          e.isSaving ||
          !e.hasProductos ||
          e.lineas.length === 0 ||
          e.hasCatalogPending
        }
        submitLabel={
          e.isEditing &&
          e.editingEstado !== "por_confirmar" &&
          !e.pendingEmitId
            ? "Actualizar"
            : "Confirmar"
        }
        compact
        size={e.step === "start" ? "lg" : "2xl"}
        layout={e.cypherOpen && e.isEditing ? "dock-left" : "center"}
        closeOnBackdrop={false}
        hideHeaderClose
        headerCenter={
          e.step === "form" && e.paginarPorOt && e.hijaFormActiva ? (
            <div className="min-w-0 max-w-full text-center">
              <p className="truncate polaria-text-body-sm font-semibold text-polaria-w">
                <span className="text-polaria-teal">
                  OT {e.formOtSafePage + 1}/{e.ordenesTrabajoForm.length}
                </span>
                <span className="mx-1.5 text-polaria-w-20">·</span>
                {e.hijaFormActiva.almacen?.trim() || e.hijaFormActiva.label}
              </p>
              <p className="truncate polaria-text-caption text-polaria-w-50">
                {e.hijaFormActiva.numeroPedido?.trim()
                  ? `OC ${e.hijaFormActiva.numeroPedido.trim()} · `
                  : null}
                Total OV ${formatPrecioEs(e.totalOvCompleta)}
              </p>
            </div>
          ) : undefined
        }
        headerTrailing={
          e.step === "form" ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                title="Guardar avance (sigue Por confirmar; no confirma el pedido)"
                aria-label="Guardar avance"
                disabled={
                  e.isSaving ||
                  e.isLoading ||
                  // Alta nueva: hace falta cliente o al menos un producto de catálogo.
                  // OV existente: siempre se puede guardar avance (REQ-134).
                  (!(e.isEditing || e.pendingEmitId) &&
                    !e.idComprador &&
                    !e.lineas.some(
                      (linea: { catalogPending?: boolean; idProducto?: string }) =>
                        !linea.catalogPending && Boolean(linea.idProducto),
                    ))
                }
                onClick={() => {
                  e.submitIntentRef.current = "draft";
                  void e.handleSubmit({
                    preventDefault() {},
                  } as FormEvent<HTMLFormElement>);
                }}
                className={cn(
                  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition",
                  "border-polaria-t-20 bg-transparent text-polaria-teal hover:bg-polaria-t-08",
                  "disabled:cursor-not-allowed disabled:opacity-40",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
                )}
              >
                {e.isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Save className="h-4 w-4" strokeWidth={2.25} aria-hidden />
                )}
              </button>
              {!e.cypherOpen && e.isEditing && e.onToggleCypher ? (
                <button
                  type="button"
                  title="Ver detalle Cypher"
                  aria-label="Abrir detalle Cypher"
                  onClick={() => e.onToggleCypher()}
                  className={cn(
                    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition",
                    "border-polaria-t-20 bg-transparent text-polaria-teal hover:bg-polaria-t-08",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
                  )}
                >
                  <Plus className="h-4 w-4" strokeWidth={2.25} aria-hidden />
                </button>
              ) : null}
            </div>
          ) : !e.cypherOpen && e.isEditing && e.onToggleCypher ? (
            <button
              type="button"
              title="Ver detalle Cypher"
              aria-label="Abrir detalle Cypher"
              onClick={() => e.onToggleCypher()}
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
        asForm={e.step === "form"}
        footerLeading={
          e.step === "pickOt" ? (
            <></>
          ) : e.step === "preview" && e.previewHijas.length > 1 ? (
            <OrdenTrabajoPager
              page={e.formOtSafePagePreview}
              total={e.previewHijas.length}
              onPrev={() => e.setFormOtPage((p: number) => Math.max(0, p - 1))}
              onNext={() =>
                e.setFormOtPage((p: number) =>
                  Math.min(Math.max(e.previewHijas.length - 1, 0), p + 1),
                )
              }
            />
          ) : e.step === "form" && e.paginarPorOt ? (
            <OrdenTrabajoPager
              page={e.formOtSafePage}
              total={e.ordenesTrabajoForm.length}
              label="Pedido OT"
              nextDisabled={e.otPagerNextBlocked}
              nextDisabledHint="Completa los campos obligatorios (*) para continuar"
              onPrev={() => e.goToOtPage(Math.max(0, e.formOtSafePage - 1))}
              onNext={() =>
                e.goToOtPage(
                  Math.min(e.ordenesTrabajoForm.length - 1, e.formOtSafePage + 1),
                )
              }
            />
          ) : undefined
        }
        footerCenter={
          <OrdenVentaFormFooterCenter
            step={e.step}
            reagruparAplicada={e.reagruparAplicada}
            onDeshacerReagrupacion={e.handleDeshacerReagrupacion}
            error={e.error}
            revisionPendiente={e.revisionPendiente}
            confirmBloqueoReason={e.confirmBloqueoReason}
            confirmSubmitDisabled={e.confirmSubmitDisabled}
            paginarPorOt={e.paginarPorOt}
            ordenesTrabajoCount={e.ordenesTrabajoForm.length}
            formOtSafePage={e.formOtSafePage}
            onGoToOtPage={e.goToOtPage}
            onFocusRevision={e.focusRevisionPendiente}
            onRequestRevisionFocus={(pendiente) => {
              e.revisionFocusRequestRef.current = pendiente;
            }}
            onClearRevisionFocusRequest={() => {
              e.revisionFocusRequestRef.current = null;
            }}
          />
        }
        footerAction={
          e.step === "pickOt" ? (
            <></>
          ) : e.step === "preview" ? (
            <button
              type="button"
              onClick={() => {
                e.setFormOtPage(0);
                e.setStep("form");
                e.setError(null);
              }}
              className={cn(
                "rounded-xl bg-polaria-teal px-5 py-2.5",
                "polaria-text-body-sm font-semibold text-polaria-on-teal transition hover:opacity-90",
              )}
            >
              Continuar al formulario
            </button>
          ) : e.step === "start" && e.startMode === "docs" ? (
            <button
              type="button"
              onClick={() => {
                void e.openFormFromDocs();
              }}
              disabled={!e.docsReady || e.isReadingIa}
              className={cn(
                "inline-flex min-w-[7rem] items-center justify-center gap-2 rounded-xl bg-polaria-teal px-5 py-2.5",
                "polaria-text-body-sm font-semibold text-polaria-on-teal transition hover:opacity-90",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              {e.isReadingIa ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : null}
              Continuar
            </button>
          ) : e.step === "start" ? (
            <></>
          ) : e.step === "form" ? (
            <button
              type="submit"
              disabled={e.confirmSubmitDisabled}
              title={
                e.confirmSubmitDisabled
                  ? (e.confirmBloqueoReason ?? "Completa lo pendiente para confirmar")
                  : undefined
              }
              aria-disabled={e.confirmSubmitDisabled}
              className={cn(
                "inline-flex min-w-[7rem] items-center justify-center gap-2 rounded-xl bg-polaria-teal px-4 py-2.5",
                "polaria-text-body-sm font-semibold text-polaria-on-teal transition hover:opacity-90",
                "disabled:cursor-not-allowed disabled:opacity-60",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
              )}
            >
              {e.isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : null}
              {e.isEditing &&
              e.editingEstado !== "por_confirmar" &&
              !e.pendingEmitId
                ? "Actualizar"
                : "Confirmar"}
            </button>
          ) : undefined
        }
        closeOnEscape={
          e.picker === null &&
          !e.isCompradorCreateOpen &&
          !e.confirmDiscrepanciasOpen &&
          !e.confirmSaveOpen &&
          !e.confirmDiscardOpen &&
          !e.addOtOpen &&
          !e.confirmRemoveOtId
        }
        submitOnEnter={false}
      >
        <OrdenVentaModalCuerpo e={e} />
      </PolariaFormModal>
      <OrdenVentaModalOverlays e={e} />
    </>
  );
}
