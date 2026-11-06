"use client";

import { PolariaConfirmDialog } from "@/components/shared/form/PolariaConfirmDialog";
import { formatEstadoOrdenVenta } from "../../../shared/constants/sales-status";
import type { EstadoOrdenVenta } from "../../../shared/types/sales.types";

export interface OrdenVentaCypherDrawerDialogsProps {
  confirmBorrarOpen: boolean;
  busyKind: "print" | "preview" | "fotos" | "borrar" | null;
  borrarError: string | null;
  onCloseBorrar: () => void;
  onConfirmBorrar: () => void;
  estadoPendiente: EstadoOrdenVenta | null;
  estadoCambiando: EstadoOrdenVenta | null;
  cambioEstadoError: string | null;
  onCloseEstado: () => void;
  onConfirmEstado: () => void;
}

export function OrdenVentaCypherDrawerDialogs({
  confirmBorrarOpen,
  busyKind,
  borrarError,
  onCloseBorrar,
  onConfirmBorrar,
  estadoPendiente,
  estadoCambiando,
  cambioEstadoError,
  onCloseEstado,
  onConfirmEstado,
}: OrdenVentaCypherDrawerDialogsProps) {
  return (
    <>
      <PolariaConfirmDialog
        open={confirmBorrarOpen}
        stackLevel="nested"
        onClose={onCloseBorrar}
        onConfirm={onConfirmBorrar}
        title="¿Borrar esta orden?"
        description="Dejará de verse en la tabla de ventas. No se elimina de forma permanente."
        confirmLabel="Sí, borrar"
        cancelLabel="Conservar"
        isSubmitting={busyKind === "borrar"}
        error={borrarError}
      />

      <PolariaConfirmDialog
        open={estadoPendiente !== null}
        stackLevel="nested"
        onClose={onCloseEstado}
        onConfirm={onConfirmEstado}
        title={
          estadoPendiente
            ? `¿Pasar a ${formatEstadoOrdenVenta(estadoPendiente)}?`
            : "¿Cambiar el estado?"
        }
        description="Este cambio no se puede deshacer. La orden solo puede seguir hacia un estado posterior."
        confirmLabel={estadoCambiando ? "Guardando…" : "Sí, cambiar estado"}
        cancelLabel="Cancelar"
        isSubmitting={estadoCambiando !== null}
        error={cambioEstadoError}
      />
    </>
  );
}
