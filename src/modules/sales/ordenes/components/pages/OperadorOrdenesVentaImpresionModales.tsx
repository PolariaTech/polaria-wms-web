"use client";

import type { OrdenVentaOperadorRow } from "../../../shared/types/sales.types";
import { OrdenVentaFotosCapturaModal } from "../modals/OrdenVentaFotosCapturaModal";
import { OrdenVentaPdfPreviewModal } from "../modals/OrdenVentaPdfPreviewModal";
import {
  OrdenVentaSeleccionOtModal,
  type OrdenVentaSeleccionOtModalProps,
} from "../modals/OrdenVentaSeleccionOtModal";
import type {
  BusyAction,
  FotosPreviewState,
  OvFeedback,
  PdfPreviewState,
  PrintRetryTarget,
  SeleccionOtState,
} from "./ov-impresion-feedback";
import { OvImpresionResultadoModal } from "./OvImpresionResultadoModal";

export interface OperadorOrdenesVentaImpresionModalesProps {
  cypherId: string | null;
  busyAction: BusyAction | null;
  seleccionOt: SeleccionOtState | null;
  onCerrarSeleccionOt: () => void;
  cargarHojas: (
    row: OrdenVentaOperadorRow,
  ) => ReturnType<OrdenVentaSeleccionOtModalProps["cargarHojas"]>;
  onConfirmarSeleccionOt: (
    actual: SeleccionOtState,
    ots: readonly number[],
  ) => void;
  feedback: OvFeedback | null;
  onReintentar: (target: PrintRetryTarget) => void;
  onCerrarFeedback: () => void;
  pdfPreview: PdfPreviewState | null;
  onCerrarPdf: () => void;
  fotosPreview: FotosPreviewState | null;
  onSelectFotosOt: (idOrdenTrabajo: string) => void;
  onVolverALasOt: () => void;
  onCerrarFotos: () => void;
}

/** Modales del flujo de impresión: elegir OT, resultado, previsualización PDF y fotos. */
export function OperadorOrdenesVentaImpresionModales({
  cypherId,
  busyAction,
  seleccionOt,
  onCerrarSeleccionOt,
  cargarHojas,
  onConfirmarSeleccionOt,
  feedback,
  onReintentar,
  onCerrarFeedback,
  pdfPreview,
  onCerrarPdf,
  fotosPreview,
  onSelectFotosOt,
  onVolverALasOt,
  onCerrarFotos,
}: OperadorOrdenesVentaImpresionModalesProps) {
  return (
    <>
      <OrdenVentaSeleccionOtModal
        open={Boolean(seleccionOt)}
        accion={seleccionOt?.accion ?? "imprimir"}
        folio={seleccionOt?.row.venta}
        yaImpresa={seleccionOt?.yaImpresa}
        ocupado={Boolean(busyAction)}
        onClose={onCerrarSeleccionOt}
        cargarHojas={() =>
          seleccionOt ? cargarHojas(seleccionOt.row) : Promise.resolve([])
        }
        onConfirmar={(ots) => {
          if (seleccionOt) onConfirmarSeleccionOt(seleccionOt, ots);
          else onCerrarSeleccionOt();
        }}
      />

      <OvImpresionResultadoModal
        resultado={feedback}
        ocupado={Boolean(busyAction)}
        reintentando={busyAction?.kind === "print"}
        onReintentar={() => {
          if (feedback?.retry) onReintentar(feedback.retry);
        }}
        onClose={onCerrarFeedback}
      />

      <OrdenVentaPdfPreviewModal
        open={Boolean(pdfPreview)}
        title={pdfPreview?.title ?? "Previsualizacion"}
        blob={pdfPreview?.blob ?? null}
        isLoading={Boolean(pdfPreview) && !pdfPreview?.blob && !pdfPreview?.error}
        error={pdfPreview?.error ?? null}
        onClose={onCerrarPdf}
        dockWithCypher={Boolean(cypherId)}
      />

      <OrdenVentaFotosCapturaModal
        open={Boolean(fotosPreview)}
        title={fotosPreview?.title ?? "Fotos"}
        ordenesTrabajo={fotosPreview?.ordenesTrabajo ?? []}
        fotos={fotosPreview?.fotos ?? []}
        selectedOt={fotosPreview?.selectedOt ?? null}
        isLoadingOts={Boolean(fotosPreview?.loadingOts)}
        isLoadingFotos={Boolean(fotosPreview?.loadingFotos)}
        allowBackToOts={!fotosPreview?.lockToOt}
        dockWithCypher={Boolean(fotosPreview?.lockToOt && cypherId)}
        error={fotosPreview?.error ?? null}
        onSelectOt={onSelectFotosOt}
        onBackToOts={onVolverALasOt}
        onClose={onCerrarFotos}
      />
    </>
  );
}
