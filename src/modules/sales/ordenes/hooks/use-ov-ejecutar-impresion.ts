import { useCallback } from "react";
import { useAuthStore } from "@/stores/auth.store";
import type { OrdenVentaOperadorRow } from "../../shared/types/sales.types";
import type { OvAccionesCtx } from "../components/pages/ov-impresion-ctx";
import { FEEDBACK_VERSION_NUEVA } from "../components/pages/ov-impresion-feedback";
import { printOrdenTareaAlmacenLandscape } from "../print/download-orden-tarea-almacen-pdf";
import {
  MENSAJE_CORREO_MAS_TARDE,
  MENSAJE_CORREO_NO_ENVIADO,
  TIPO_CORREO_NO_ENVIADO,
  esErrorDeVersionVieja,
} from "../print/print-correo-fallo";
import {
  printQueueLogMensaje,
  printQueuePayload,
  printQueueUserMessage,
} from "../print/print-queue-status";
import { filtrarHojasElegidas } from "../print-batch/batch-seleccion";
import { postOrdenVentaLog, postOrdenVentaLogForOts } from "../services/orden-venta-log.client";
import type { useOvLoadPrintSheets } from "./use-ov-load-print-sheets";

type CtxImpresion = Pick<
  OvAccionesCtx,
  | "codigoCuenta"
  | "printingLockRef"
  | "setBusyAction"
  | "setFeedback"
  | "showFeedback"
  | "marcarCorreoNoEnviado"
  | "quitarCorreoNoEnviado"
>;

/** Imprime una OV (o solo las OT elegidas) y registra el resultado en bitácora. */
export function useOvEjecutarImpresion(
  ctx: CtxImpresion,
  loadPrintSheets: ReturnType<typeof useOvLoadPrintSheets>,
) {
  const {
    codigoCuenta,
    printingLockRef,
    setBusyAction,
    setFeedback,
    showFeedback,
    marcarCorreoNoEnviado,
    quitarCorreoNoEnviado,
  } = ctx;

  return useCallback(
    async (
      row: OrdenVentaOperadorRow,
      modo: "inicial" | "reintento" = "inicial",
      ots?: readonly number[],
    ) => {
      if (!codigoCuenta || printingLockRef.current) return;
      printingLockRef.current = true;
      setBusyAction({ id: row.idOrdenVenta, kind: "print" });

      try {
        const sheets = ots?.length
          ? filtrarHojasElegidas(await loadPrintSheets(row), ots)
          : await loadPrintSheets(row);
        if (sheets.length === 0) {
          throw new Error("No hay datos para generar el PDF.");
        }
        // Mismo PDF horizontal multipágina que la previsualización (con surtido).
        const printed = await printOrdenTareaAlmacenLandscape(sheets, {
          codigoCuenta,
        });
        const codigoOv = row.venta?.trim() || "";
        const message = printQueueUserMessage({
          outcome: printed.queue,
          impresora: printed.impresora,
          codigo: codigoOv,
          hojas: sheets.length,
        });
        showFeedback({
          ok: true,
          title: message.title,
          detail: message.detail,
        });
        quitarCorreoNoEnviado(row.idOrdenVenta);
        const session = useAuthStore.getState().session;
        const autor = session?.nombre?.trim() || "usuario";
        void postOrdenVentaLogForOts({
          idOrdenVenta: row.idOrdenVenta,
          codigoCuenta,
          accion: "actualizacion",
          mensaje: printQueueLogMensaje({
            outcome: printed.queue,
            impresora: printed.impresora,
            autor,
            auto: false,
          }),
          idUsuario: session?.idUsuario ?? null,
          autorNombre: session?.nombre ?? null,
          idBodega: row.idBodega ?? null,
          idOrdenesTrabajo: sheets.map((sheet) => sheet.idOrdenTrabajo),
          payloadExtra: printQueuePayload({
            tipo: "impresion_pdf",
            hojas: sheets.length,
            impresora: printed.impresora,
            outcome: printed.queue,
          }),
        });
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "No se pudo enviar a la impresora.";
        console.error("[ov] no se envió el correo a la impresora:", message);
        if (esErrorDeVersionVieja(error)) {
          // REQ-189: pestaña con versión vieja. No es un fallo de impresión: no se registra
          // ni se marca la OV; basta con recargar la página.
          setFeedback(FEEDBACK_VERSION_NUEVA);
          return;
        }
        if (modo === "reintento") {
          const session = useAuthStore.getState().session;
          await postOrdenVentaLog({
            idOrdenVenta: row.idOrdenVenta,
            codigoCuenta,
            accion: "actualizacion",
            mensaje: MENSAJE_CORREO_MAS_TARDE,
            idUsuario: session?.idUsuario ?? null,
            autorNombre: session?.nombre ?? null,
            idBodega: row.idBodega ?? null,
            payloadExtra: {
              tipo: TIPO_CORREO_NO_ENVIADO,
              detalle: message,
            },
          });
          marcarCorreoNoEnviado(row.idOrdenVenta);
          setFeedback({
            ok: false,
            title: MENSAJE_CORREO_MAS_TARDE,
            lines: [],
            retry: null,
          });
        } else {
          setFeedback({
            ok: false,
            title: MENSAJE_CORREO_NO_ENVIADO,
            lines: [],
            retry: {
              idOrdenVenta: row.idOrdenVenta,
              venta: row.venta,
              idBodega: row.idBodega ?? null,
              ots,
            },
          });
        }
      } finally {
        printingLockRef.current = false;
        setBusyAction(null);
      }
    },
    [
      codigoCuenta,
      loadPrintSheets,
      marcarCorreoNoEnviado,
      printingLockRef,
      quitarCorreoNoEnviado,
      setBusyAction,
      setFeedback,
      showFeedback,
    ],
  );
}
