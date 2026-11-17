"use client";

import { useEffect, useMemo, useState } from "react";
import { obtenerFilaCorreo } from "../services/correo-fila.client";
import type { CorreoFila } from "../types/correos.types";
import { useIngresoCorreo } from "./useIngresoCorreo";

export function useFilaCorreo(messageId: string) {
  const { locales, ingresar, sondear } = useIngresoCorreo();
  const [fila, setFila] = useState<CorreoFila | null>(null);
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    const control = new AbortController();
    setFila(null);
    setFallo(false);
    obtenerFilaCorreo(messageId, control.signal)
      .then((leida) => {
        if (!control.signal.aborted) setFila(leida);
      })
      .catch(() => {
        if (!control.signal.aborted) setFallo(true);
      });
    return () => control.abort();
  }, [messageId]);

  const combinada = useMemo<CorreoFila | null>(() => {
    if (!fila) return null;
    const local = locales[messageId];
    return local ? { ...fila, ingreso: local } : fila;
  }, [fila, locales, messageId]);

  useEffect(() => {
    if (combinada?.ingreso?.estado === "procesando") sondear(messageId);
  }, [combinada, sondear, messageId]);

  return { fila: combinada, fallo, ingresar };
}
