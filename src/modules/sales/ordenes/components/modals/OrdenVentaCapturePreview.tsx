"use client";

import type { FormEvent } from "react";
import { Save } from "lucide-react";
import { PolariaFormInput } from "@/components/shared/form/PolariaFormField";
import { PolariaConfirmDialog } from "@/components/shared/form/PolariaConfirmDialog";
import { formatIsoToDdMmYyyy } from "@/lib/utils/fecha-dd-mm-yyyy";
import { FECHA_ENTREGA_ATRASADA_WARNING, isFechaEntregaIsoValida } from "../../utils/pedido/pedido-form-validation";
import { reagruparModalAbierto } from "../../utils/ot/reagrupacion-modal-estado";
import { OrdenVentaReagruparOtModal } from "./OrdenVentaReagruparOtModal";
import type { OrdenVentaModalDialogsProps } from "../../types/orden-venta-create-modal.types";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { OrdenTrabajoPreviewList } from "../orden-trabajo/OrdenTrabajoPreviewList";
import type { OrdenTrabajoHija } from "../../utils/origen/origen-correo-ordenes-trabajo";

export function OrdenVentaCapturePreview({
  clienteLabel,
  hijas,
  page,
  onRemoveHija,
  onAddTarea,
}: {
  clienteLabel: string;
  hijas: OrdenTrabajoHija[];
  page: number;
  onRemoveHija: (hijaId: string) => void;
  onAddTarea: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <OrdenTrabajoPreviewList
        clienteLabel={clienteLabel}
        hijas={hijas}
        page={page}
        onRemoveHija={onRemoveHija}
      />
      <button
        type="button"
        onClick={onAddTarea}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-4 py-2.5",
          "polaria-text-body-sm font-semibold text-polaria-w transition hover:border-polaria-teal",
        )}
      >
        <Plus className="h-4 w-4 text-polaria-teal" aria-hidden />
        Agregar tarea de almacén
      </button>
    </div>
  );
}


export function OrdenVentaModalDialogs(p: OrdenVentaModalDialogsProps) {
  const {
    confirmDiscrepanciasOpen, setConfirmDiscrepanciasOpen, skipDiscrepanciaConfirmRef,
    skipSaveConfirmRef, handleSubmit, avisosValidacion, canReemplazarDiscrepancia,
    handleReemplazarDiscrepancia, confirmSaveOpen, setConfirmSaveOpen, esPorConfirmar,
    fechaEntrega, setMissingFields, setError, isEditing, editingEstado,
    fechaEntregaAtrasada, avisoPotencialDuplicado, confirmDiscardOpen,
    setConfirmDiscardOpen, onClose, ordenesTrabajoForm, confirmRemoveOtId,
    setConfirmRemoveOtId, handleConfirmRemoveOrdenTrabajo, addOtOpen, setAddOtOpen,
    addOtAlmacen, setAddOtAlmacen, addOtNumeroPedido, setAddOtNumeroPedido,
    handleAddOrdenTrabajo, reagruparOpen, cypherOpen,
    editingId, folioVisible, setReagruparOpen, obtenerSolicitudReagrupacion,
    handleAplicarReagrupacion, handleAplicarCorreccionCorreo,
  } = p;
  return (
    <>
      <PolariaConfirmDialog
        open={confirmDiscrepanciasOpen}
        stackLevel="nested"
        onClose={() => setConfirmDiscrepanciasOpen(false)}
        onConfirm={() => {
          setConfirmDiscrepanciasOpen(false);
          // Una sola confirmación: "Usar valores del pedido" ya autoriza el envío.
          skipDiscrepanciaConfirmRef.current = true;
          skipSaveConfirmRef.current = true;
          void handleSubmit({
            preventDefault() {},
          } as FormEvent<HTMLFormElement>);
        }}
        title="Revisa diferencias antes de confirmar"
        description="Si continúas, queda lo de la columna «Definitivo». Revisa qué cambió:"
        confirmLabel="Aceptar"
        cancelLabel="Volver a editar"
        size="lg"
      >
        {avisosValidacion.length > 0 ? (
          <ul className="divide-y divide-polaria-w-08 rounded-xl border border-polaria-w-08">
            {avisosValidacion.map((item) => {
              const showReemplazar = canReemplazarDiscrepancia(item);
              const isFecha = item.fieldKey === "fechaEntrega";
              const reemplazarLabel =
                isFecha && item.db === "Hoy o posterior"
                  ? "Usar hoy"
                  : "Usar del catálogo";
              // REQ-105: columnas Inicial / Definitivo (todas las filas).
              const leftLabel = "Inicial";
              const rightLabel = "Definitivo";
              const leftValue =
                isFecha && item.db === "Leída del correo"
                  ? "Vacía / no leída del correo"
                  : isFecha && item.db === "Hoy o posterior"
                    ? "Fecha atrasada (catálogo pide hoy o posterior)"
                    : item.db || "—";
              return (
              <li key={item.fieldKey || item.campo} className="px-3 py-2.5 sm:px-3.5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="polaria-text-caption font-semibold uppercase tracking-wide text-polaria-warning">
                    {item.campo}
                  </p>
                  {showReemplazar ? (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        handleReemplazarDiscrepancia(item);
                      }}
                      className={cn(
                        "rounded-lg border border-polaria-t-20 bg-polaria-t-08 px-2.5 py-1",
                        "polaria-text-caption font-semibold text-polaria-teal transition hover:opacity-90",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal",
                      )}
                    >
                      {reemplazarLabel}
                    </button>
                  ) : null}
                </div>
                <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2 sm:gap-2">
                  <div>
                    <p className="polaria-text-caption text-polaria-w-20">
                      {leftLabel}
                    </p>
                    <p className="mt-0.5 line-clamp-3 break-words polaria-text-body-sm text-polaria-w-50">
                      {leftValue}
                    </p>
                  </div>
                  <div>
                    <p className="polaria-text-caption text-polaria-teal">
                      {rightLabel}
                    </p>
                    <p className="mt-0.5 line-clamp-3 break-words polaria-text-body-sm text-polaria-w">
                      {item.ia || "—"}
                    </p>
                  </div>
                </div>
              </li>
              );
            })}
          </ul>
        ) : (
          <p className="polaria-text-body-sm text-polaria-w-50">
            Si continúas, se usarán los valores de este pedido.
          </p>
        )}
      </PolariaConfirmDialog>

      <PolariaConfirmDialog
        open={confirmSaveOpen}
        stackLevel="nested"
        onClose={() => setConfirmSaveOpen(false)}
        onConfirm={() => {
          if (
            esPorConfirmar &&
            !isFechaEntregaIsoValida(fechaEntrega)
          ) {
            setConfirmSaveOpen(false);
            setMissingFields((prev) => new Set(prev).add("fechaEntrega"));
            setError("Ingresa la fecha de entrega.");
            return;
          }
          setConfirmSaveOpen(false);
          skipSaveConfirmRef.current = true;
          void handleSubmit({
            preventDefault() {},
          } as FormEvent<HTMLFormElement>);
        }}
        title={
          isEditing && editingEstado !== "por_confirmar"
            ? "¿Actualizar el pedido?"
            : "¿Confirmar el pedido?"
        }
        description={
          isEditing && editingEstado !== "por_confirmar"
            ? "Se actualizarán los datos del pedido."
            : "El pedido pasará a Confirmada y se enviará a bodega."
        }
        confirmLabel="Confirmar"
        cancelLabel={
          isEditing && editingEstado !== "por_confirmar" ? (
            "Revisar"
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <Save className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
              Revisar
            </span>
          )
        }
      >
        {isFechaEntregaIsoValida(fechaEntrega) ? (
          <p className="polaria-text-body-sm text-polaria-w-50">
            Fecha de entrega:{" "}
            <span className="font-semibold text-polaria-w">
              {formatIsoToDdMmYyyy(fechaEntrega)}
            </span>
          </p>
        ) : null}
        {fechaEntregaAtrasada ? (
          <p className="rounded-xl border border-polaria-warning-border bg-polaria-warning-bg px-4 py-3 polaria-text-body-sm text-polaria-warning">
            {FECHA_ENTREGA_ATRASADA_WARNING}
          </p>
        ) : null}
        {avisoPotencialDuplicado ? (
          <p className="rounded-xl border border-polaria-warning-border bg-polaria-warning-bg px-4 py-3 polaria-text-body-sm text-polaria-warning">
            {avisoPotencialDuplicado.ia}
          </p>
        ) : null}
      </PolariaConfirmDialog>

      <PolariaConfirmDialog
        open={confirmDiscardOpen}
        stackLevel="nested"
        onClose={() => setConfirmDiscardOpen(false)}
        onConfirm={() => {
          setConfirmDiscardOpen(false);
          onClose();
        }}
        title="¿Salir del pedido?"
        description={
          ordenesTrabajoForm.length > 1
            ? "Se perderá el progreso capturado, incluidas las órdenes de trabajo."
            : "Se perderá el progreso capturado y volverás a Ventas."
        }
        confirmLabel="Salir"
        cancelLabel="Seguir editando"
      />

      <PolariaConfirmDialog
        open={addOtOpen}
        stackLevel="nested"
        onClose={() => {
          setAddOtOpen(false);
          setError(null);
        }}
        onConfirm={handleAddOrdenTrabajo}
        title="¿Agregar tarea de almacén?"
        description="Se creará una orden de trabajo adicional. Indica el centro de consumo y confirma."
        confirmLabel="Sí, agregar"
        cancelLabel="Cancelar"
      >
        <div className="flex flex-col gap-3">
          <PolariaFormInput
            id="orden-venta-add-ot-almacen"
            label="Centro de consumo"
            required
            value={addOtAlmacen}
            onChange={(event) => setAddOtAlmacen(event.target.value)}
            placeholder="Ej. BANQUETES, CANTINA…"
            autoFocus
          />
          <PolariaFormInput
            id="orden-venta-add-ot-numero-pedido"
            label="Orden de compra del cliente"
            value={addOtNumeroPedido}
            onChange={(event) => setAddOtNumeroPedido(event.target.value)}
            placeholder="Opcional"
          />
        </div>
      </PolariaConfirmDialog>

      <PolariaConfirmDialog
        open={Boolean(confirmRemoveOtId)}
        stackLevel="nested"
        onClose={() => setConfirmRemoveOtId(null)}
        onConfirm={handleConfirmRemoveOrdenTrabajo}
        title="¿Eliminar esta tarea de almacén?"
        description="Se quitará la tarea y sus productos de esta venta. Esta acción no se puede deshacer aquí."
        confirmLabel="Sí, eliminar"
        cancelLabel="Conservar"
      />

      <OrdenVentaReagruparOtModal
        open={reagruparModalAbierto({
          reagruparOpen,
          cypherOpen,
          isEditing,
          tieneOrdenVenta: Boolean(editingId),
        })}
        idOrdenVenta={editingId}
        folio={folioVisible}
        onClose={() => setReagruparOpen(false)}
        obtenerSolicitud={obtenerSolicitudReagrupacion}
        onAplicar={handleAplicarReagrupacion}
        onAplicarCorreccion={handleAplicarCorreccionCorreo}
      />
        </>
  );
}
