"use client";

import { Loader2, Square } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import type { CorreoFila } from "../types/correos.types";
import {
  cargarReintentables,
  conErrorLocal,
  ejecutarLoteReintentos,
  enProcesoLocal,
  esErrorYaIngresado,
  motivoFallo,
  textoError,
  type ProgresoLote,
} from "../utils/correos-reintentar.helpers";
import { esperarResultadoIngreso } from "../utils/esperar-resultado-ingreso";
import { CorreosReintentarFila } from "./CorreosReintentarFila";

interface CorreosReintentarModalProps {
  open: boolean;
  onClose: () => void;
  onTerminado: () => void;
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
    const controlCarga = new AbortController();
    void recargar(controlCarga.signal);
    return () => {
      controlCarga.abort();
      loteAbortRef.current?.abort();
      loteAbortRef.current = null;
    };
  }, [open, recargar]);

  const actualizarFila = (
    messageId: string,
    transformar: (fila: CorreoFila) => CorreoFila,
  ) => {
    setFilas((previas) =>
      previas.map((fila) =>
        fila.messageId === messageId ? transformar(fila) : fila,
      ),
    );
  };

  const quitarFila = (messageId: string) => {
    setFilas((previas) =>
      previas.filter((fila) => fila.messageId !== messageId),
    );
  };

  const detenerLote = () => {
    loteAbortRef.current?.abort();
  };

  const reintentarUno = async (messageId: string) => {
    if (progreso !== null || activo !== null) return;
    setActivo(messageId);
    setError(null);
    actualizarFila(messageId, enProcesoLocal);
    try {
      const resultado = await esperarResultadoIngreso(messageId);
      if (resultado.estado === "ingresado") {
        quitarFila(messageId);
        onTerminado();
        return;
      }
      const motivo = motivoFallo(resultado);
      actualizarFila(messageId, (fila) => conErrorLocal(fila, motivo));
      setError(motivo);
    } catch (causa) {
      if (esErrorYaIngresado(causa)) {
        quitarFila(messageId);
        onTerminado();
        return;
      }
      const motivo = textoError(causa);
      actualizarFila(messageId, (fila) => conErrorLocal(fila, motivo));
      setError(motivo);
    } finally {
      setActivo(null);
    }
  };

  const reintentarTodos = async () => {
    if (filas.length === 0 || progreso !== null || activo !== null) return;
    const control = new AbortController();
    loteAbortRef.current = control;
    setError(null);
    const resultado = await ejecutarLoteReintentos([...filas], {
      signal: control.signal,
      onProgreso: setProgreso,
      onActivo: setActivo,
      onMarcarFila: (id, fila) => actualizarFila(id, () => fila),
      onQuitarFila: quitarFila,
    });
    if (loteAbortRef.current === control) {
      loteAbortRef.current = null;
    }
    setActivo(null);
    setProgreso(null);
    setFilas(resultado.pendientes);
    if (resultado.ok > 0) onTerminado();
    if (resultado.pendientes.length === 0) {
      onClose();
      return;
    }
    setError(resultado.error);
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
