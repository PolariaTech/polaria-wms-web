"use client";

import { Loader2, Square } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import type { CorreoFila } from "../types/correos.types";
import {
  cargarReintentables,
  conErrorLocal,
  enProcesoLocal,
  esAbortado,
  esErrorQueCortaLote,
  esErrorYaIngresado,
  motivoFallo,
  resumenDetenido,
  resumenLote,
  textoError,
} from "../utils/correos-reintentar.helpers";
import {
  esperarResultadoIngreso,
  pausaEntreReintentos,
} from "../utils/esperar-resultado-ingreso";
import { CorreosReintentarFila } from "./CorreosReintentarFila";

interface CorreosReintentarModalProps {
  open: boolean;
  onClose: () => void;
  onTerminado: () => void;
}

interface ProgresoLote {
  hechos: number;
  total: number;
  ok: number;
  asuntoActual: string;
}

/**
 * REQ-387: lista solo correos en «Reintentar» y permite reintentar uno o todos.
 */
export function CorreosReintentarModal({
  open,
  onClose,
  onTerminado,
}: CorreosReintentarModalProps) {
  const [filas, setFilas] = useState<CorreoFila[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progreso, setProgreso] = useState<ProgresoLote | null>(null);
  const [activo, setActivo] = useState<string | null>(null);
  const loteAbortRef = useRef<AbortController | null>(null);

  const recargar = useCallback(async (signal: AbortSignal) => {
    setCargando(true);
    setError(null);
    try {
      setFilas(await cargarReintentables(signal));
    } catch (causa) {
      if (signal.aborted) return;
      setError(textoError(causa));
      setFilas([]);
    } finally {
      if (!signal.aborted) setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      loteAbortRef.current?.abort();
      loteAbortRef.current = null;
      return;
    }
    const ac = new AbortController();
    void recargar(ac.signal);
    return () => {
      ac.abort();
      loteAbortRef.current?.abort();
      loteAbortRef.current = null;
    };
  }, [open, recargar]);

  const marcarFila = (messageId: string, siguiente: CorreoFila) => {
    setFilas((previas) =>
      previas.map((actual) => (actual.messageId === messageId ? siguiente : actual)),
    );
  };

  const quitarFila = (messageId: string) => {
    setFilas((previas) => previas.filter((actual) => actual.messageId !== messageId));
  };

  const detenerLote = () => {
    loteAbortRef.current?.abort();
  };

  const reintentarUno = async (messageId: string) => {
    if (progreso !== null || activo !== null) return;
    setActivo(messageId);
    setError(null);
    setFilas((previas) =>
      previas.map((f) => (f.messageId === messageId ? enProcesoLocal(f) : f)),
    );
    try {
      const resultado = await esperarResultadoIngreso(messageId);
      if (resultado.estado === "ingresado") {
        quitarFila(messageId);
        onTerminado();
        return;
      }
      const motivo = motivoFallo(resultado);
      setFilas((previas) =>
        previas.map((f) => (f.messageId === messageId ? conErrorLocal(f, motivo) : f)),
      );
      setError(motivo);
    } catch (causa) {
      if (esErrorYaIngresado(causa)) {
        quitarFila(messageId);
        onTerminado();
        return;
      }
      const motivo = textoError(causa);
      setFilas((previas) =>
        previas.map((f) => (f.messageId === messageId ? conErrorLocal(f, motivo) : f)),
      );
      setError(motivo);
    } finally {
      setActivo(null);
    }
  };

  const reintentarTodos = async () => {
    if (filas.length === 0 || progreso !== null || activo !== null) return;
    const lote = [...filas];
    const control = new AbortController();
    loteAbortRef.current = control;
    setError(null);
    const fallidas: CorreoFila[] = [];
    let ok = 0;
    let indiceCorte: number | null = null;
    let errorCorte: string | null = null;

    for (let i = 0; i < lote.length; i += 1) {
      if (control.signal.aborted) {
        indiceCorte = i;
        break;
      }
      const fila = lote[i]!;
      setActivo(fila.messageId);
      setProgreso({
        hechos: i + 1,
        total: lote.length,
        ok,
        asuntoActual: fila.asunto?.trim() || "(sin asunto)",
      });
      marcarFila(fila.messageId, enProcesoLocal(fila));
      try {
        const resultado = await esperarResultadoIngreso(
          fila.messageId,
          control.signal,
        );
        if (resultado.estado === "ingresado") {
          ok += 1;
          quitarFila(fila.messageId);
        } else {
          const fallida = conErrorLocal(fila, motivoFallo(resultado));
          fallidas.push(fallida);
          marcarFila(fila.messageId, fallida);
        }
      } catch (causa) {
        if (esAbortado(causa) || control.signal.aborted) {
          marcarFila(fila.messageId, fila);
          indiceCorte = i;
          break;
        }
        if (esErrorYaIngresado(causa)) {
          ok += 1;
          quitarFila(fila.messageId);
        } else {
          const motivo = textoError(causa);
          const fallida = conErrorLocal(fila, motivo);
          fallidas.push(fallida);
          marcarFila(fila.messageId, fallida);
          if (esErrorQueCortaLote(causa)) {
            errorCorte = motivo;
            indiceCorte = i + 1;
            break;
          }
        }
      }
      if (i < lote.length - 1) {
        try {
          await pausaEntreReintentos(control.signal);
        } catch {
          indiceCorte = i + 1;
          break;
        }
      }
    }

    if (loteAbortRef.current === control) {
      loteAbortRef.current = null;
    }
    const sinProcesar = indiceCorte !== null ? lote.slice(indiceCorte) : [];
    const pendientes = [...fallidas, ...sinProcesar];
    setActivo(null);
    setProgreso(null);
    setFilas(pendientes);
    if (ok > 0) onTerminado();

    if (pendientes.length === 0) {
      onClose();
      return;
    }
    setError(
      control.signal.aborted
        ? resumenDetenido(ok, pendientes.length)
        : resumenLote(ok, errorCorte ? fallidas : pendientes, lote.length),
    );
  };

  const enLote = progreso !== null;
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <PolariaFormModal
      open={open}
      onClose={() => {
        if (enLote) return;
        onClose();
      }}
      title="Correos por reintentar"
      description="Solo ingresos en error o vencidos. Cada reintento espera el resultado; el lote va uno a uno para no saturar Gmail."
      size="lg"
      asForm={false}
      hideFooter={false}
      hideHeaderClose
      submitLabel={
        progreso
          ? `Procesando ${progreso.hechos}/${progreso.total}`
          : "Reintentar para todos"
      }
      cancelLabel="Cerrar"
      submitDisabled={cargando || enLote || activo !== null || filas.length === 0}
      isSubmitting={enLote}
      onSubmit={(evento) => {
        evento.preventDefault();
        void reintentarTodos();
      }}
      footerLeading={
        progreso ? (
          <p className="polaria-text-caption max-w-xs truncate text-polaria-w-50" role="status">
            Correo {progreso.hechos} de {progreso.total}
            {progreso.ok > 0 ? ` · ${progreso.ok} ok` : ""}:{" "}
            <span className="text-polaria-w">{progreso.asuntoActual}</span>
          </p>
        ) : undefined
      }
      footerBeforeCancel={
        enLote ? (
          <button
            type="button"
            onClick={detenerLote}
            className="inline-flex items-center gap-1.5 rounded-xl border border-polaria-t-20 px-3.5 py-2.5 polaria-text-body-sm text-polaria-w transition hover:bg-polaria-t-08 hover:text-polaria-teal"
          >
            <Square className="h-3.5 w-3.5" aria-hidden />
            Detener
          </button>
        ) : undefined
      }
      error={error}
      closeOnEscape={!enLote}
      closeOnBackdrop={!enLote}
    >
      {cargando ? (
        <div className="flex items-center gap-2 py-8 text-polaria-w-50">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          <span className="polaria-text-body-sm">Cargando pendientes…</span>
        </div>
      ) : filas.length === 0 ? (
        <p className="polaria-text-body-sm py-6 text-polaria-w-50">
          No hay correos pendientes de reintentar.
        </p>
      ) : (
        <ul className="divide-y divide-polaria-w-08" role="list">
          {filas.map((fila) => (
            <CorreosReintentarFila
              key={fila.messageId}
              fila={fila}
              activo={activo === fila.messageId}
              ocupado={activo !== null || enLote}
              onReintentar={(id) => void reintentarUno(id)}
            />
          ))}
        </ul>
      )}
    </PolariaFormModal>,
    document.body,
  );
}
