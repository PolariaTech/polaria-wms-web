"use client";

import type { OrdenVentaOperadorRow } from "../../../shared/types/sales.types";
import type { AutoPrintOvResult } from "../../print/auto-print-ov-tras-emitir";
import type { OvPaneles } from "../../hooks/use-ov-paneles";
import { OrdenVentaCreateModal } from "../modals/OrdenVentaCreateModal";
import { OrdenVentaDetalleModal } from "../modals/OrdenVentaDetalleModal";
import { resolveCreateCypherTarget } from "./ov-create-draft-session";
import { cypherMatchesCreateDraft } from "./ov-listado-chrome";

export interface OperadorOrdenesVentaFormulariosProps {
  paneles: OvPaneles;
  codigoCuenta: string | null;
  inspect: boolean;
  rows: OrdenVentaOperadorRow[];
  onReload: () => void;
  onEmitSuccess: (info: { idOrdenVenta: string; codigo: string }) => void;
  onAutoPrintResult: (result: AutoPrintOvResult) => void;
}

/** Modales de detalle (lectura) y de formulario de venta (crear/editar). */
export function OperadorOrdenesVentaFormularios({
  paneles,
  codigoCuenta,
  inspect,
  rows,
  onReload,
  onEmitSuccess,
  onAutoPrintResult,
}: OperadorOrdenesVentaFormulariosProps) {
  const { cypherId, detalleId, editingId, createDraftId, editLock } = paneles;

  return (
    <>
      <OrdenVentaDetalleModal
        idOrdenVenta={detalleId}
        codigoCuenta={codigoCuenta}
        inspect={inspect}
        cypherOpen={Boolean(
          !inspect && detalleId && cypherId && detalleId === cypherId,
        )}
        onToggleCypher={
          !inspect && detalleId
            ? () => {
                paneles.setCypherId((prev) =>
                  prev === detalleId ? null : detalleId,
                );
              }
            : undefined
        }
        onCompanionOtPickerChange={paneles.setCompanionOtPicker}
        onClose={() => {
          // Al cancelar/salir del detalle, cerrar también Cypher de ese pedido.
          const closingId = detalleId;
          paneles.setDetalleId(null);
          paneles.setCompanionOtPicker(null);
          paneles.setCypherId((prev) =>
            prev && closingId && prev === closingId ? null : prev,
          );
        }}
        onEmitted={inspect ? undefined : onReload}
        onEmitSuccess={inspect ? undefined : onEmitSuccess}
        onAutoPrintResult={inspect ? undefined : onAutoPrintResult}
      />

      <OrdenVentaCreateModal
        open={!inspect && paneles.isCreateOpen}
        idOrdenVenta={editingId}
        codigoVenta={
          editingId
            ? (rows.find((r) => r.idOrdenVenta === editingId)?.venta ?? null)
            : null
        }
        cypherOpen={cypherMatchesCreateDraft({
          cypherId,
          editingId,
          createDraftId,
        })}
        onOrdenIdReady={(id) => {
          paneles.setCreateDraftId(id);
          paneles.setCypherId(id);
        }}
        onToggleCypher={
          resolveCreateCypherTarget(editingId, createDraftId)
            ? () => {
                const target = resolveCreateCypherTarget(editingId, createDraftId);
                if (!target) return;
                paneles.setCypherId((prev) => (prev === target ? null : target));
              }
            : undefined
        }
        onCompanionOtPickerChange={paneles.setCompanionOtPicker}
        onCompanionIdCompradorChange={paneles.setCompanionIdComprador}
        abrirReagruparAlCargar={Boolean(
          editingId &&
            paneles.reagruparAlAbrirId === editingId &&
            !editLock.soloLectura,
        )}
        onReagruparAlCargarAtendido={paneles.limpiarReagruparAlAbrir}
        operadorRowsForDuplicado={rows}
        soloLectura={editLock.soloLectura}
        editLockHolderNombre={editLock.holderNombre}
        onClose={() => paneles.cerrarFormulario(true)}
        onCreated={onReload}
        onEmitSuccess={onEmitSuccess}
        onAutoPrintResult={onAutoPrintResult}
      />
    </>
  );
}
