import { useCallback, useState } from "react";
import type { OrdenVentaOperadorRow } from "../../shared/types/sales.types";
import type { OvAccionesCtx } from "../components/pages/ov-impresion-ctx";
import type {
  PdfPreviewState,
  SeleccionOtState,
} from "../components/pages/ov-impresion-feedback";
import type { AccionSobreOt } from "../components/modals/OrdenVentaSeleccionOtModal";
import { filtrarHojasElegidas } from "../print-batch/batch-seleccion";
import { logTieneImpresion } from "../print-batch/ya-impresas";
import { fetchOrdenVentaLog } from "../services/orden-venta-log.client";
import { buildOvPdfBlobConTimeout } from "../utils/pdf/build-ov-pdf-con-timeout";
import type { useOvLoadPrintSheets } from "./use-ov-load-print-sheets";

/** Modal «¿qué OT?» de imprimir/descargar y la previsualización del PDF. */
export function useOvSeleccionPdf(
  ctx: Pick<OvAccionesCtx, "codigoCuenta" | "runScoped" | "printingLockRef" | "setBusyAction">,
  loadPrintSheets: ReturnType<typeof useOvLoadPrintSheets>,
) {
  const { codigoCuenta, runScoped, printingLockRef, setBusyAction } = ctx;
  const [seleccionOt, setSeleccionOt] = useState<SeleccionOtState | null>(null);
  const [pdfPreview, setPdfPreview] = useState<PdfPreviewState | null>(null);

  /**
   * «Imprimir» y «Descarga» del Cypher (activos desde que la OV está confirmada) preguntan primero
   * qué OT salen. Sustituye al diálogo «¿Imprimir de nuevo?» (REQ-137): el aviso va en el modal.
   */
  const abrirSeleccionOt = useCallback(
    (row: OrdenVentaOperadorRow, accion: AccionSobreOt) => {
      if (printingLockRef.current) return;
      setSeleccionOt({ row, accion, yaImpresa: false });
      if (accion !== "imprimir" || !codigoCuenta) return;
      // REQ-137: si ya se imprimió, el modal lo avisa. Si el log falla, no se bloquea nada.
      void runScoped(() =>
        fetchOrdenVentaLog({ codigoCuenta, idOrdenVenta: row.idOrdenVenta }),
      ).then(
        (log) => {
          if (!logTieneImpresion(log)) return;
          setSeleccionOt((actual) =>
            actual?.row.idOrdenVenta === row.idOrdenVenta ? { ...actual, yaImpresa: true } : actual,
          );
        },
        () => undefined,
      );
    },
    [codigoCuenta, printingLockRef, runScoped],
  );

  const openPdfPreview = useCallback(
    async (row: OrdenVentaOperadorRow, ots?: readonly number[]) => {
      if (!codigoCuenta || printingLockRef.current) return;
      printingLockRef.current = true;
      setBusyAction({ id: row.idOrdenVenta, kind: "preview" });
      const title = `Previsualizacion · ${row.venta}`;
      setPdfPreview({ title, blob: null, error: null });

      try {
        const sheets = ots?.length
          ? filtrarHojasElegidas(await loadPrintSheets(row), ots)
          : await loadPrintSheets(row);
        const blob = await buildOvPdfBlobConTimeout(sheets);
        setPdfPreview({ title, blob, error: null });
      } catch (error: unknown) {
        setPdfPreview({
          title,
          blob: null,
          error:
            error instanceof Error
              ? error.message
              : "No se pudo generar el PDF.",
        });
      } finally {
        printingLockRef.current = false;
        setBusyAction(null);
      }
    },
    [codigoCuenta, loadPrintSheets, printingLockRef, setBusyAction],
  );

  return {
    seleccionOt,
    setSeleccionOt,
    pdfPreview,
    setPdfPreview,
    abrirSeleccionOt,
    openPdfPreview,
  };
}
