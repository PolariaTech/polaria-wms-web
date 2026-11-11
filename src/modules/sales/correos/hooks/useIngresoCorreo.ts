"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePolariaToast } from "@/components/shared/toast/PolariaToastProvider";
import {
  consultarIngreso,
  CorreosApiError,
  ingresarCorreo,
} from "../services/correos.client";
import type { IngresoCorreo } from "../types/correos.types";
import { mensajeDeError } from "../utils/correos-formato";

const SONDEO_CADA_MS = 3_000;

const ERRORES_QUE_CORTAN_EL_SONDEO: ReadonlySet<string> = new Set([
  "SESION",
  "SIN_PERMISO",
  "CUENTA_NO_HABILITADA",
]);

function esperar(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolver) => {
    if (signal.aborted) {
      resolver();
      return;
    }
    const alTerminar = () => {
      clearTimeout(temporizador);
      resolver();
    };
    const temporizador = setTimeout(() => {
      signal.removeEventListener("abort", alTerminar);
      resolver();
    }, ms);
    signal.addEventListener("abort", alTerminar, { once: true });
  });
}

const enProceso = (messageId: string): IngresoCorreo => ({
  messageId,
  estado: "procesando",
  idOrdenVenta: null,
  codigoOrdenVenta: null,
  error: null,
});

const conError = (messageId: string, error: string): IngresoCorreo => ({
  ...enProceso(messageId),
  estado: "error",
  error,
});

/** Una consulta del avance; `null` si falló por algo pasajero y conviene volver a intentar. */
async function consultarSinCortar(
  messageId: string,
  signal: AbortSignal,
): Promise<IngresoCorreo | null> {
  try {
    return await consultarIngreso(messageId, signal);
  } catch (causa) {
    if (signal.aborted) return null;
    if (causa instanceof CorreosApiError && ERRORES_QUE_CORTAN_EL_SONDEO.has(causa.codigo)) {
      return conError(messageId, causa.message);
    }
    return null;
  }
}

/** Consulta el ingreso hasta que el api deje de decir `procesando` o se aborte. */
async function seguirIngreso(
  messageId: string,
  signal: AbortSignal,
  alTerminar: (ingreso: IngresoCorreo) => void,
): Promise<void> {
  while (!signal.aborted) {
    await esperar(SONDEO_CADA_MS, signal);
    if (signal.aborted) return;
    const ingreso = await consultarSinCortar(messageId, signal);
    if (ingreso && ingreso.estado !== "procesando") return alTerminar(ingreso);
  }
}

/** Si el api dice que ya estaba ingresado, trae la OV que lo ingresó. */
async function recuperarYaIngresado(
  causa: unknown,
  messageId: string,
): Promise<IngresoCorreo | null> {
  if (!(causa instanceof CorreosApiError) || causa.codigo !== "YA_INGRESADO") return null;
  try {
    return await consultarIngreso(messageId);
  } catch {
    return null;
  }
}

/** El aviso (toast) con el que termina un ingreso: éxito con el código de la OV, o el motivo. */
function useAvisoDeIngreso() {
  const { showToast } = usePolariaToast();
  return useCallback(
    (ingreso: IngresoCorreo) => {
      if (ingreso.estado === "ingresado") {
        showToast({
          variant: "success",
          title: "Pedido ingresado",
          content: ingreso.codigoOrdenVenta
            ? `Quedó registrado como ${ingreso.codigoOrdenVenta}.`
            : "Quedó registrado como orden de venta.",
        });
      } else if (ingreso.estado === "error") {
        showToast({
          variant: "error",
          title: "No se pudo ingresar el pedido",
          content: ingreso.error ?? "Intenta de nuevo.",
          durationMs: 6000,
        });
      }
    },
    [showToast],
  );
}

/** Un seguimiento por correo, que se corta al salir de la pantalla. */
function useSeguimientos(alTerminar: (ingreso: IngresoCorreo) => void) {
  const seguimientos = useRef(new Map<string, AbortController>());

  useEffect(() => {
    const activos = seguimientos.current;
    return () => {
      activos.forEach((control) => control.abort());
      activos.clear();
    };
  }, []);

  return useCallback(
    (messageId: string) => {
      if (seguimientos.current.has(messageId)) return;
      const control = new AbortController();
      seguimientos.current.set(messageId, control);
      void seguirIngreso(messageId, control.signal, alTerminar).finally(() => {
        seguimientos.current.delete(messageId);
      });
    },
    [alTerminar],
  );
}

/**
 * El ingreso manual de un correo como OV (REQ-104): lo reserva, sigue su avance y avisa al
 * terminar. `locales` es lo que la persona acaba de hacer y manda sobre lo que trajo la lista.
 */
export function useIngresoCorreo() {
  const { showToast } = usePolariaToast();
  const avisar = useAvisoDeIngreso();
  const [locales, setLocales] = useState<Record<string, IngresoCorreo>>({});

  const fijar = useCallback((ingreso: IngresoCorreo) => {
    setLocales((previo) => ({ ...previo, [ingreso.messageId]: ingreso }));
  }, []);
  const terminar = useCallback(
    (ingreso: IngresoCorreo) => {
      fijar(ingreso);
      avisar(ingreso);
    },
    [avisar, fijar],
  );
  const sondear = useSeguimientos(terminar);

  const ingresar = useCallback(
    async (messageId: string) => {
      fijar(enProceso(messageId));
      try {
        const ingreso = await ingresarCorreo(messageId);
        fijar(ingreso);
        if (ingreso.estado === "procesando") sondear(messageId);
        else avisar(ingreso);
      } catch (causa) {
        const yaIngresado = await recuperarYaIngresado(causa, messageId);
        if (!yaIngresado) return terminar(conError(messageId, mensajeDeError(causa)));
        fijar(yaIngresado);
        showToast({ variant: "info", content: mensajeDeError(causa) });
      }
    },
    [avisar, fijar, showToast, sondear, terminar],
  );

  return { locales, ingresar, sondear };
}
