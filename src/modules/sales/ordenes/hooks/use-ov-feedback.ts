import { useCallback, useRef, useState } from "react";
import {
  FEEDBACK_VERSION_NUEVA,
  type OvFeedback,
  type PrintRetryTarget,
} from "../components/pages/ov-impresion-feedback";
import {
  autoPrintResultToFeedback,
  type AutoPrintOvResult,
} from "../print/auto-print-ov-tras-emitir";
import { MENSAJE_CORREO_NO_ENVIADO } from "../print/print-correo-fallo";

/** Un solo modal: orden confirmada + impresión (REQ-039). */
export function useOvFeedback({
  quitarCorreoNoEnviado,
}: {
  quitarCorreoNoEnviado: (idOrdenVenta: string) => void;
}) {
  const [feedback, setFeedback] = useState<OvFeedback | null>(null);
  const lastEmitRef = useRef<PrintRetryTarget | null>(null);

  const showFeedback = useCallback(
    (item: { ok: boolean; title: string; detail: string }) => {
      setFeedback({
        ok: item.ok,
        title: item.title,
        lines: item.detail.trim() ? [item.detail.trim()] : [],
        retry: null,
      });
    },
    [],
  );

  const handleEmitSuccess = useCallback(
    (info: { idOrdenVenta: string; codigo: string }) => {
      const codigo = info.codigo.trim() || "OV";
      lastEmitRef.current = {
        idOrdenVenta: info.idOrdenVenta,
        venta: codigo,
        idBodega: null,
      };
      setFeedback({
        ok: true,
        title: `${codigo} confirmada`,
        lines: ["El pedido ya está confirmado y listo para bodega."],
        retry: null,
      });
    },
    [],
  );

  const handleAutoPrintResult = useCallback(
    (result: AutoPrintOvResult) => {
      const print = autoPrintResultToFeedback(result);
      if (!print) return;
      if (!print.ok) {
        if (print.versionVieja) {
          // Pestaña con versión vieja: no es un fallo del correo y reintentar fallaría igual.
          setFeedback(FEEDBACK_VERSION_NUEVA);
          return;
        }
        const target = lastEmitRef.current;
        setFeedback({
          ok: false,
          title: MENSAJE_CORREO_NO_ENVIADO,
          lines: [],
          retry: target,
        });
        return;
      }
      if (lastEmitRef.current) {
        quitarCorreoNoEnviado(lastEmitRef.current.idOrdenVenta);
      }
      const printLine = print.line;
      setFeedback((prev) => {
        if (prev?.title.toLowerCase().includes("confirmada")) {
          // La OV ya salió bien: el chulo se queda; la línea de impresión aclara el resto.
          return {
            ok: true,
            title: prev.title,
            lines: [...prev.lines, printLine],
            retry: null,
          };
        }
        return {
          ok: print.ok,
          title: print.title,
          lines: [print.detail],
          retry: null,
        };
      });
    },
    [quitarCorreoNoEnviado],
  );

  return {
    feedback,
    setFeedback,
    showFeedback,
    handleEmitSuccess,
    handleAutoPrintResult,
  };
}
