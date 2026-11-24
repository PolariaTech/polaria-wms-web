import { useCallback } from "react";
import { useAuthStore } from "@/stores/auth.store";
import type { OvAccionesCtx } from "../components/pages/ov-impresion-ctx";
import {
  FEEDBACK_VERSION_NUEVA,
  type PrintRetryTarget,
} from "../components/pages/ov-impresion-feedback";
import { autoPrintOrdenVentaTrasEmitir } from "../print/auto-print-ov-tras-emitir";
import {
  MENSAJE_CORREO_MAS_TARDE,
  TIPO_CORREO_NO_ENVIADO,
  esErrorDeVersionVieja,
} from "../print/print-correo-fallo";
import { printQueueUserMessage } from "../print/print-queue-status";
import { postOrdenVentaLog } from "../services/orden-venta-log.client";
import type { useOvEjecutarImpresion } from "./use-ov-ejecutar-impresion";

/** Reintenta el envío a impresora: por la fila del listado, o reimprimiendo desde el servidor. */
export function useOvReintentarEnvio(
  ctx: OvAccionesCtx,
  executePrint: ReturnType<typeof useOvEjecutarImpresion>,
) {
  const {
    codigoCuenta,
    printingLockRef,
    setBusyAction,
    setFeedback,
    showFeedback,
    marcarCorreoNoEnviado,
    quitarCorreoNoEnviado,
    rowsRef,
  } = ctx;

  return useCallback(
    (target: PrintRetryTarget) => {
      const row = rowsRef.current.find(
        (item) => item.idOrdenVenta === target.idOrdenVenta,
      );
      if (row) {
        void executePrint(row, "reintento", target.ots);
        return;
      }
      if (!codigoCuenta || printingLockRef.current) return;
      printingLockRef.current = true;
      setBusyAction({ id: target.idOrdenVenta, kind: "print" });
      const session = useAuthStore.getState().session;
      void autoPrintOrdenVentaTrasEmitir({
        codigoCuenta,
        idOrdenVenta: target.idOrdenVenta,
        autorNombre: session?.nombre ?? null,
        idUsuario: session?.idUsuario ?? null,
        autoImprimirKnown: true,
      })
        .then(async (result) => {
          if (result.status === "ok") {
            quitarCorreoNoEnviado(target.idOrdenVenta);
            const message = printQueueUserMessage({
              outcome: result.queue,
              impresora: result.impresora,
              codigo: result.codigo || target.venta,
              hojas: result.hojas,
            });
            showFeedback({
              ok: true,
              title: message.title,
              detail: message.detail,
            });
            return;
          }
          const detalle =
            result.status === "error"
              ? result.message
              : "No se pudo enviar a la impresora.";
          console.error("[ov] reintento de correo a impresora:", detalle);
          if (esErrorDeVersionVieja(detalle)) {
            setFeedback(FEEDBACK_VERSION_NUEVA);
            return;
          }
          await postOrdenVentaLog({
            idOrdenVenta: target.idOrdenVenta,
            codigoCuenta,
            accion: "actualizacion",
            mensaje: MENSAJE_CORREO_MAS_TARDE,
            idUsuario: session?.idUsuario ?? null,
            autorNombre: session?.nombre ?? null,
            idBodega: target.idBodega,
            payloadExtra: {
              tipo: TIPO_CORREO_NO_ENVIADO,
              detalle,
            },
          });
          marcarCorreoNoEnviado(target.idOrdenVenta);
          setFeedback({
            ok: false,
            title: MENSAJE_CORREO_MAS_TARDE,
            lines: [],
            retry: null,
          });
        })
        .finally(() => {
          printingLockRef.current = false;
          setBusyAction(null);
        });
    },
    [
      codigoCuenta,
      executePrint,
      marcarCorreoNoEnviado,
      printingLockRef,
      quitarCorreoNoEnviado,
      rowsRef,
      setBusyAction,
      setFeedback,
      showFeedback,
    ],
  );
}
