"use client";

import { Loader2, Printer } from "lucide-react";
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
import {
  CodigoDespachoError,
  imprimirCodigoDespacho,
  prepararCodigoDespacho,
} from "./imprimir-codigo-despacho";

const FOCO =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg";

interface Aviso {
  tipo: TipoMensajeBatch;
  texto: string;
}

interface Previa {
  pdf: Blob;
  url: string;
}

/**
 * REQ-306: muestra la hoja con el QR de despacho y la manda a imprimir, dentro de Ventas como las
 * otras impresiones. Lo que se ve en la vista previa es exactamente lo que sale en la impresora.
 */
export function CodigoDespachoPageContent() {
  const { codigoCuenta } = useAdminMaestroScope();
  const zonaHoraria = useCuentaZonaHoraria(codigoCuenta);
  // undefined = todavía consultando; null = la cuenta no tiene impresora configurada.
  const [hayImpresora, setHayImpresora] = useState<boolean | null | undefined>(undefined);
  const [previa, setPrevia] = useState<Previa | null>(null);
  const [errorPrevia, setErrorPrevia] = useState<string | null>(null);
  const [imprimiendo, setImprimiendo] = useState(false);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  useEffect(() => {
    if (!codigoCuenta) return;
    let vigente = true;
    getImpresoraActivaCuenta(codigoCuenta).then(
      (destino) => {
        if (vigente) setHayImpresora(destino ? true : null);
      },
      () => {
        if (vigente) setHayImpresora(null);
      },
    );
    return () => {
      vigente = false;
    };
  }, [codigoCuenta]);

  useEffect(() => {
    if (!codigoCuenta) return;
    let vigente = true;
    let objectUrl: string | null = null;
    setPrevia(null);
    setErrorPrevia(null);
    prepararCodigoDespacho(codigoCuenta).then(
      (pdf) => {
        if (!vigente) return;
        objectUrl = URL.createObjectURL(pdf);
        setPrevia({ pdf, url: objectUrl });
      },
      (causa: unknown) => {
        if (!vigente) return;
        setErrorPrevia(
          causa instanceof CodigoDespachoError
            ? causa.message
            : "No se pudo generar la vista previa. Inténtalo de nuevo.",
        );
      },
    );
    return () => {
      vigente = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [codigoCuenta]);

  async function imprimir() {
    if (!codigoCuenta || !previa) return;
    setImprimiendo(true);
    setAviso(null);
    try {
      const enviado = await imprimirCodigoDespacho(previa.pdf, codigoCuenta);
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

  const sinImpresora = hayImpresora === null;

  return (
    <OperationalModuleShell
      title="Código de despacho"
      description="Hoja con el código QR que abre la lista de órdenes alistadas y en alistamiento para despachar."
      gate={{ roles: ROLES_NIVEL_CUENTA }}
      fitViewport
      compactoEnPantallaBaja
    >
      {/* El módulo ya mide el alto de la ventana: la vista previa toma lo que sobra. */}
      <div className="flex min-h-0 flex-col gap-4 lg:flex-1 [@media(max-height:50rem)]:gap-2">
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void imprimir()}
            disabled={imprimiendo || !previa || sinImpresora}
            className={cn(
              "polaria-text-body-sm inline-flex min-h-11 items-center gap-2 rounded-xl border border-polaria-teal bg-polaria-teal px-4 font-semibold text-polaria-on-teal transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 [@media(max-height:50rem)]:min-h-9",
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
              <Printer className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            )}
            {imprimiendo ? "Enviando a la impresora…" : "Imprimir código"}
          </button>
        </div>

        {sinImpresora ? (
          <ImpresionBatchMensaje tipo="aviso">
            La cuenta no tiene una impresora configurada. Pide que la configuren para poder imprimir.
          </ImpresionBatchMensaje>
        ) : null}
        {errorPrevia ? <ImpresionBatchMensaje tipo="error">{errorPrevia}</ImpresionBatchMensaje> : null}
        {aviso ? <ImpresionBatchMensaje tipo={aviso.tipo}>{aviso.texto}</ImpresionBatchMensaje> : null}

        {previa ? (
          <iframe
            title="Vista previa de la hoja con el código QR de despacho"
            src={previa.url}
            className="h-[28rem] min-h-[20rem] w-full rounded-2xl border border-polaria-w-08 bg-polaria-bg lg:h-auto lg:min-h-0 lg:flex-1"
          />
        ) : errorPrevia ? null : (
          <div className="polaria-text-body flex h-64 items-center justify-center rounded-2xl border border-polaria-w-08 text-polaria-w-50">
            Preparando la hoja…
          </div>
        )}
      </div>
    </OperationalModuleShell>
  );
}
