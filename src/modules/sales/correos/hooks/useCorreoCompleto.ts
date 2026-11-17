"use client";

import { useCallback, useEffect, useState } from "react";
import { descargarAdjunto, obtenerCorreoCompleto } from "../services/correos.client";
import type { AdjuntoCorreo, CorreoContenido } from "../types/correos.types";
import { mensajeDeError } from "../utils/correos-formato";

interface ResultadoDeLectura {
  /** De qué lectura es: si cambia el correo o se reintenta, el resultado anterior ya no vale. */
  clave: string;
  correo?: CorreoContenido;
  error?: string;
}

/** Lee el correo completo (cuerpo y datos de los adjuntos) al abrir la pantalla. */
export function useCorreoCompleto(messageId: string) {
  const [intento, setIntento] = useState(0);
  const [resultado, setResultado] = useState<ResultadoDeLectura>({ clave: "" });
  const clave = `${messageId}:${intento}`;

  useEffect(() => {
    const control = new AbortController();
    obtenerCorreoCompleto(messageId, control.signal)
      .then((correo) => setResultado({ clave, correo }))
      .catch((causa: unknown) => {
        if (!control.signal.aborted) setResultado({ clave, error: mensajeDeError(causa) });
      });
    return () => control.abort();
  }, [messageId, clave]);

  const reintentar = useCallback(() => setIntento((previo) => previo + 1), []);
  const actual = resultado.clave === clave ? resultado : null;
  return {
    correo: actual?.correo ?? null,
    error: actual?.error ?? null,
    cargando: actual === null,
    reintentar,
  };
}

function guardarComoArchivo(url: string, nombre: string): void {
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
}

const REVOCAR_URL_EN_MS = 60_000;

/**
 * Descarga un adjunto con la sesión (no es un enlace simple) y lo guarda como archivo.
 * «Ver» vive en la columna derecha (`VisorAdjuntoCorreo`), no aquí.
 */
export function useDescargaDeAdjuntos(messageId: string) {
  const [ocupado, setOcupado] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const descargar = useCallback(
    async (adjunto: AdjuntoCorreo) => {
      setOcupado(adjunto.indice);
      setError(null);
      try {
        const archivo = await descargarAdjunto(messageId, adjunto.indice);
        const url = URL.createObjectURL(archivo);
        guardarComoArchivo(url, adjunto.nombre);
        setTimeout(() => URL.revokeObjectURL(url), REVOCAR_URL_EN_MS);
      } catch (causa) {
        setError(mensajeDeError(causa));
      } finally {
        setOcupado(null);
      }
    },
    [messageId],
  );

  return { ocupado, error, descargar };
}
