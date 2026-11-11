"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getImpresoraActivaCuenta } from "@/modules/configurator/impresoras/services/impresoras.service";
import { printQueueUserMessage } from "../print/print-queue-status";
import { enviarPaquete, esperaEntrePartes, mensajeDeFallo, partesDe } from "./enviar-paquete";
import type { TipoMensajeBatch } from "./ImpresionBatchMensaje";
import { horaEnCuenta, hojasDelPaquete, type PreviaBatch } from "./utilidades-batch";

/** Lo que se le dice al operador cuando el envío termina. */
export interface AvisoEnvio {
  tipo: TipoMensajeBatch;
  title: string;
  detail: string;
}

interface Entrada {
  codigoCuenta: string | null | undefined;
  zonaHoraria: string;
}

interface AccionesEnvio {
  /** Justo antes de empezar a mandar: la pantalla limpia sus errores. */
  alIniciar?: () => void;
  /** Se detuvo por un fallo; el paquete queda para reintentar desde la parte que falló. */
  alFallar: (mensaje: string) => void;
  /** Salió todo (o la última parte): la pantalla muestra el aviso y suelta la vista previa. */
  alTerminar: (aviso: AvisoEnvio) => void;
}

/**
 * El envío de un paquete a la impresora, común a la rápida y la detallada: confirmación, impresora
 * activa, envío parte por parte con su avance y reintento desde la parte que falló sin repetir las
 * que ya salieron.
 */
export function useEnvioPaquete({ codigoCuenta, zonaHoraria }: Entrada) {
  const [confirmando, setConfirmando] = useState(false);
  const [impresora, setImpresora] = useState<string | null>(null);
  const [modoEnvio, setModoEnvio] = useState<string | null>(null);
  const [imprimiendo, setImprimiendo] = useState(false);
  const [progresoEnvio, setProgresoEnvio] = useState<string | null>(null);
  /** Próxima parte por mandar: tras un fallo a mitad se retoma desde ahí. */
  const [siguienteParte, setSiguienteParte] = useState(0);
  const montada = useRef(true);

  useEffect(() => {
    montada.current = true;
    return () => {
      montada.current = false;
    };
  }, []);

  const reiniciarPartes = useCallback(() => setSiguienteParte(0), []);

  const pedirConfirmacion = useCallback(() => {
    setConfirmando(true);
    if (!codigoCuenta) return;
    void getImpresoraActivaCuenta(codigoCuenta).then(
      (destino) => {
        setImpresora(destino?.nombre?.trim() || null);
        setModoEnvio(destino?.modoEnvio ?? null);
      },
      () => setImpresora(null),
    );
  }, [codigoCuenta]);

  const imprimir = async (previa: PreviaBatch | null, acciones: AccionesEnvio): Promise<void> => {
    if (!previa || !codigoCuenta) return;
    setImprimiendo(true);
    acciones.alIniciar?.();
    const total = partesDe(previa).length;
    const resultado = await enviarPaquete({
      previa,
      codigoCuenta,
      desde: siguienteParte,
      esperaMs: esperaEntrePartes(modoEnvio),
      alCambiar: (indice, de, fase, segundos) =>
        setProgresoEnvio(
          fase === "enviando"
            ? `Enviando parte ${indice + 1} de ${de}…`
            : `Parte ${indice + 1} de ${de} enviada. La siguiente sale en ${segundos} s.`,
        ),
      cancelado: () => !montada.current,
    });
    if (!montada.current) return;
    setProgresoEnvio(null);
    setConfirmando(false);
    setImprimiendo(false);
    setSiguienteParte(resultado.siguiente);

    if (resultado.error !== undefined) {
      acciones.alFallar(mensajeDeFallo(resultado.error, resultado.siguiente, total));
      return;
    }
    if (!resultado.ultimo) return;
    const mensaje = printQueueUserMessage({
      outcome: resultado.ultimo.queue,
      impresora: resultado.ultimo.impresora,
      codigo: `${previa.resumen.length} OV`,
      hojas: hojasDelPaquete(previa),
    });
    const kind = resultado.ultimo.queue.kind;
    setSiguienteParte(0);
    acciones.alTerminar({
      // Solo es «todo bien» si la cola lo confirma; si quedó en espera, se avisa en ámbar.
      tipo: kind === "printing" || kind === "unknown" ? "ok" : "aviso",
      title: mensaje.title,
      detail: `${mensaje.detail}${total > 1 ? ` Se mandó en ${total} partes.` : ""} Terminó a las ${horaEnCuenta(zonaHoraria)}.`,
    });
  };

  return {
    confirmando,
    setConfirmando,
    impresora,
    modoEnvio,
    imprimiendo,
    progresoEnvio,
    siguienteParte,
    reiniciarPartes,
    pedirConfirmacion,
    imprimir,
  };
}
