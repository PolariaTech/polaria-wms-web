"use client";

import type { Dispatch, SetStateAction } from "react";
import type { OrdenVentaOperadorRow } from "../../../shared/types/sales.types";
import type { OvPaneles } from "../../hooks/use-ov-paneles";
import { puedeModificarConIaDesdeLista } from "../../utils/ot/reagrupacion-modal-estado";
import type { AccionSobreOt } from "../modals/OrdenVentaSeleccionOtModal";
import { OrdenVentaCypherDrawer } from "../modals/OrdenVentaCypherDrawer";
import type {
  BusyAction,
  PdfPreviewState,
  SeleccionOtState,
} from "./ov-impresion-feedback";

export interface OperadorOrdenesVentaCypherProps {
  paneles: OvPaneles;
  codigoCuenta: string | null;
  inspect: boolean;
  rows: OrdenVentaOperadorRow[];
  busyAction: BusyAction | null;
  onReload: () => void;
  onBorrar: (() => Promise<void>) | undefined;
  abrirSeleccionOt: (row: OrdenVentaOperadorRow, accion: AccionSobreOt) => void;
  openFotosCaptura: (row: OrdenVentaOperadorRow, idOrdenTrabajo?: string | null) => Promise<void>;
  setSeleccionOt: Dispatch<SetStateAction<SeleccionOtState | null>>;
  setPdfPreview: Dispatch<SetStateAction<PdfPreviewState | null>>;
}

/** Panel Cypher de la OV seleccionada y sus acciones (editar, imprimir, fotos, borrar…). */
export function OperadorOrdenesVentaCypher({
  paneles,
  codigoCuenta,
  inspect,
  rows,
  busyAction,
  onReload,
  onBorrar,
  abrirSeleccionOt,
  openFotosCaptura,
  setSeleccionOt,
  setPdfPreview,
}: OperadorOrdenesVentaCypherProps) {
  const {
    cypherId,
    detalleId,
    isCreateOpen,
    editLock,
    formularioDelCypherRef,
  } = paneles;
  const filaDelCypher = cypherId
    ? (rows.find((fila) => fila.idOrdenVenta === cypherId) ?? null)
    : null;
  /** Fila del Cypher si admite acciones (no cancelada); si no, `null`. */
  const filaAccionable =
    filaDelCypher && filaDelCypher.estado !== "cancelada" ? filaDelCypher : null;

  return (
    <OrdenVentaCypherDrawer
      idOrdenVenta={inspect ? null : cypherId}
      codigoCuenta={codigoCuenta}
      row={filaDelCypher}
      inspect={inspect}
      companionWithEdit={paneles.companionWithCypher}
      companionOtPicker={paneles.companionOtPicker}
      companionIdComprador={paneles.companionIdComprador}
      onReagruparDesdeLista={
        cypherId &&
        puedeModificarConIaDesdeLista({
          inspect,
          cypherId,
          formularioAbierto: isCreateOpen,
          detalleAbierto: Boolean(detalleId),
          estadoOrdenVenta: filaDelCypher?.estado,
        })
          ? () => {
              void editLock.prepareOpenEdit(cypherId).then((apertura) => {
                formularioDelCypherRef.current = true;
                paneles.setEditingId(cypherId);
                paneles.setIsCreateOpen(true);
                if (!apertura.soloLectura) paneles.setReagruparAlAbrirId(cypherId);
              });
            }
          : undefined
      }
      busyKind={cypherId && busyAction?.id === cypherId ? busyAction.kind : null}
      onClose={() => {
        paneles.setCypherId(null);
        paneles.setCompanionOtPicker(null);
        // Todo lo que se abrió desde el Cypher se cierra con él.
        setSeleccionOt(null);
        setPdfPreview(null);
        if (formularioDelCypherRef.current) paneles.cerrarFormulario(false);
      }}
      onEdit={() => {
        if (!cypherId || !filaAccionable) return;
        void editLock.prepareOpenEdit(cypherId).then(() => {
          formularioDelCypherRef.current = true;
          paneles.setDetalleId(null);
          paneles.setEditingId(cypherId);
          paneles.setIsCreateOpen(true);
        });
      }}
      onPrint={() => {
        if (filaAccionable) abrirSeleccionOt(filaAccionable, "imprimir");
      }}
      onPreview={() => {
        if (filaAccionable) abrirSeleccionOt(filaAccionable, "descargar");
      }}
      onFotos={(idOrdenTrabajo) => {
        if (filaAccionable) void openFotosCaptura(filaAccionable, idOrdenTrabajo);
      }}
      onEstadoCambiado={onReload}
      onBorrar={onBorrar}
    />
  );
}
