"use client";

import { Loader2, QrCode } from "lucide-react";
import { useEffect, useState } from "react";
import { OperationalModuleShell } from "@/components/shared/module/OperationalModuleShell";
import { ROLES_NIVEL_CUENTA } from "@/constants/wms/roles";
import { cn } from "@/lib/utils/cn";
import { useAdminMaestroScope } from "@/modules/admin-panel/shared/hooks/useAdminMaestroScope";
import { useCuentaZonaHoraria } from "@/modules/configurator/cuentas/hooks/useCuentaZonaHoraria";
import { getImpresoraActivaCuenta } from "@/modules/configurator/impresoras/services/impresoras.service";
import {
  ImpresionBatchMensaje,
  type TipoMensajeBatch,
} from "@/modules/sales/ordenes/print-batch/ImpresionBatchMensaje";
import { horaEnCuenta } from "@/modules/sales/ordenes/print-batch/utilidades-batch";
import { printQueueUserMessage } from "@/modules/sales/ordenes/print/print-queue-status";
import { CodigoDespachoError, imprimirCodigoDespacho } from "./imprimir-codigo-despacho";

const FOCO =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg";

interface Aviso {
  tipo: TipoMensajeBatch;
  texto: string;
}

/** REQ-306: manda a imprimir la hoja con el QR de despacho, dentro de Ventas como las otras impresiones. */
export function CodigoDespachoPageContent() {
  const { codigoCuenta } = useAdminMaestroScope();
  const zonaHoraria = useCuentaZonaHoraria(codigoCuenta);
  // undefined = todavía consultando; null = la cuenta no tiene impresora configurada.
  const [impresora, setImpresora] = useState<string | null | undefined>(undefined);
  const [imprimiendo, setImprimiendo] = useState(false);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  useEffect(() => {
    if (!codigoCuenta) return;
    let vigente = true;
    getImpresoraActivaCuenta(codigoCuenta).then(
      (destino) => {
        if (vigente) setImpresora(destino ? destino.nombre?.trim() || "la impresora de la cuenta" : null);
      },
      () => {
        if (vigente) setImpresora(null);
      },
    );
    return () => {
      vigente = false;
    };
  }, [codigoCuenta]);

  async function imprimir() {
    if (!codigoCuenta) return;
    setImprimiendo(true);
    setAviso(null);
    try {
      const enviado = await imprimirCodigoDespacho(codigoCuenta);
      const kind = enviado.queue.kind;
      const salioBien = kind === "printing" || kind === "unknown";
      const detalle = salioBien
        ? `Se envió a ${enviado.impresora.trim() || "la impresora"}.`
        : printQueueUserMessage({ outcome: enviado.queue, impresora: enviado.impresora }).detail;
      setAviso({
        tipo: salioBien ? "ok" : "aviso",
        texto: `${detalle} Terminó a las ${horaEnCuenta(zonaHoraria)}.`,
      });
    } catch (causa: unknown) {
      setAviso({
        tipo: "error",
        texto:
          causa instanceof CodigoDespachoError
            ? causa.message
            : "No se pudo enviar a la impresora. Inténtalo de nuevo.",
      });
    } finally {
      setImprimiendo(false);
    }
  }

  const sinImpresora = impresora === null;

  return (
    <OperationalModuleShell
      title="Código de despacho"
      description="Hoja con el código QR que abre la lista de órdenes alistadas y en alistamiento para despachar."
      gate={{ roles: ROLES_NIVEL_CUENTA }}
    >
      <div className="flex max-w-xl flex-col gap-4">
        <p className="polaria-text-body">
          Imprime la hoja y déjala en el área de despacho. Quien escanee el código ve la lista
          actualizada de la cuenta, sin iniciar sesión.
        </p>
        {sinImpresora ? (
          <ImpresionBatchMensaje tipo="aviso">
            La cuenta no tiene una impresora configurada. Pide que la configuren para poder imprimir.
          </ImpresionBatchMensaje>
        ) : impresora ? (
          <p className="polaria-text-body-sm text-polaria-w-50">Se imprimirá en {impresora}.</p>
        ) : null}
        <div>
          <button
            type="button"
            onClick={() => void imprimir()}
            disabled={imprimiendo || !codigoCuenta || sinImpresora}
            className={cn(
              "polaria-text-body-sm inline-flex min-h-11 items-center gap-2 rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-4 font-medium text-polaria-teal transition-colors hover:bg-polaria-t-20 disabled:opacity-60 [@media(max-height:50rem)]:min-h-9",
              FOCO,
            )}
          >
            {imprimiendo ? (
              <Loader2
                className="h-4 w-4 animate-spin motion-reduce:animate-none"
                strokeWidth={1.75}
                aria-hidden
              />
            ) : (
              <QrCode className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            )}
            {imprimiendo ? "Enviando a la impresora…" : "Imprimir código"}
          </button>
        </div>
        {aviso ? <ImpresionBatchMensaje tipo={aviso.tipo}>{aviso.texto}</ImpresionBatchMensaje> : null}
      </div>
    </OperationalModuleShell>
  );
}
