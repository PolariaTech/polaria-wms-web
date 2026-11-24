"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import type { CorreoFila } from "../types/correos.types";
import {
  cargarReintentables,
  conErrorLocal,
  enProcesoLocal,
  motivoFallo,
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
  const [progreso, setProgreso] = useState<{
    hechos: number;
    total: number;
  } | null>(null);
  const [activo, setActivo] = useState<string | null>(null);

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
    if (!open) return;
    const ac = new AbortController();
    void recargar(ac.signal);
    return () => ac.abort();
  }, [open, recargar]);

  const cerrarTrasLote = () => {
    setProgreso(null);
    setActivo(null);
    onTerminado();
    onClose();
  };

  const marcarFila = (messageId: string, siguiente: CorreoFila) => {
    setFilas((previas) =>
      previas.map((actual) =>
        actual.messageId === messageId ? siguiente : actual,
      ),
    );
  };

  const reintentarUno = async (messageId: string) => {
    setActivo(messageId);
    setError(null);
    setFilas((previas) =>
      previas.map((fila) =>
        fila.messageId === messageId ? enProcesoLocal(fila) : fila,
      ),
    );
    try {
      const resultado = await esperarResultadoIngreso(messageId);
      if (resultado.estado === "ingresado") {
        setFilas((previas) =>
          previas.filter((fila) => fila.messageId !== messageId),
        );
        return;
      }
      const motivo = motivoFallo(resultado);
      setFilas((previas) =>
        previas.map((fila) =>
          fila.messageId === messageId ? conErrorLocal(fila, motivo) : fila,
        ),
      );
      setError(motivo);
    } catch (causa) {
      const motivo = textoError(causa);
      setFilas((previas) =>
        previas.map((fila) =>
          fila.messageId === messageId ? conErrorLocal(fila, motivo) : fila,
        ),
      );
      setError(motivo);
    } finally {
      setActivo(null);
    }
  };

  const reintentarTodos = async () => {
    if (filas.length === 0 || progreso) return;
    const lote = [...filas];
    setProgreso({ hechos: 1, total: lote.length });
    setError(null);
    const pendientes: CorreoFila[] = [];
    let ok = 0;

    for (let i = 0; i < lote.length; i += 1) {
      const fila = lote[i]!;
      setActivo(fila.messageId);
      setProgreso({ hechos: i + 1, total: lote.length });
      marcarFila(fila.messageId, enProcesoLocal(fila));
      try {
        const resultado = await esperarResultadoIngreso(fila.messageId);
        if (resultado.estado === "ingresado") {
          ok += 1;
          setFilas((previas) =>
            previas.filter((actual) => actual.messageId !== fila.messageId),
          );
        } else {
          const fallida = conErrorLocal(fila, motivoFallo(resultado));
          pendientes.push(fallida);
          marcarFila(fila.messageId, fallida);
        }
      } catch (causa) {
        const fallida = conErrorLocal(fila, textoError(causa));
        pendientes.push(fallida);
        marcarFila(fila.messageId, fallida);
      }
      if (i < lote.length - 1) {
        try {
          await pausaEntreReintentos();
        } catch {
          break;
        }
      }
    }

    setActivo(null);
    setFilas(pendientes);
    setProgreso(null);
    if (pendientes.length === 0) {
      cerrarTrasLote();
      return;
    }
    setError(resumenLote(ok, pendientes, lote.length));
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
      submitLabel="Reintentar para todos"
      cancelLabel="Cerrar"
      submitDisabled={cargando || enLote || filas.length === 0}
      isSubmitting={enLote}
      onSubmit={(evento) => {
        evento.preventDefault();
        void reintentarTodos();
      }}
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
              ocupado={activo === fila.messageId || enLote}
              onReintentar={(id) => void reintentarUno(id)}
            />
          ))}
        </ul>
      )}
      {progreso ? (
        <p className="polaria-text-caption mt-3 text-polaria-w-50" role="status">
          Correo {progreso.hechos} de {progreso.total}: esperando resultado (máx.
          ~90 s por correo)…
        </p>
      ) : null}
    </PolariaFormModal>,
    document.body,
  );
}
