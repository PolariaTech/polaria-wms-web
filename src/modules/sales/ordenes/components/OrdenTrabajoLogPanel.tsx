"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { formatDateTime } from "@/components/shared/utils/formatters";
import { fetchOrdenVentaLog } from "../services/orden-venta-log.client";
import type { OrdenVentaLogEntry } from "../types/orden-venta-log.types";
import { filterLogEntriesVisible } from "../utils/filter-log-entries-visible";

interface OrdenTrabajoLogPanelProps {
  idOrdenVenta: string;
  codigoCuenta: string;
  /** Filtra eventos de esta OT (+ eventos de toda la OV). */
  idOrdenTrabajo?: string | null;
  createdAt?: string | null;
  autorNombre?: string | null;
}

function LogLine({
  entry,
  full = false,
}: {
  entry: OrdenVentaLogEntry;
  /** En el modal se muestra el mensaje completo (sin clamp). */
  full?: boolean;
}) {
  return (
    <li className="min-w-0 border-b border-polaria-w-08 py-1.5 last:border-b-0">
      <p
        className={
          full
            ? "whitespace-pre-wrap polaria-text-caption text-polaria-w"
            : "line-clamp-2 polaria-text-caption text-polaria-w"
        }
      >
        {entry.mensaje}
      </p>
      <p className="mt-0.5 polaria-text-caption text-polaria-w-20">
        {formatDateTime(entry.createdAt)}
        {entry.autor ? ` · ${entry.autor}` : ""}
      </p>
    </li>
  );
}

function OrdenTrabajoLogModal({
  open,
  onClose,
  entries,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  entries: OrdenVentaLogEntry[];
  loading: boolean;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-polaria-bg/80 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[min(80dvh,32rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-polaria-t-20 bg-polaria-bg"
      >
        <div className="flex items-center justify-between border-b border-polaria-w-08 px-4 py-3">
          <h2 id={titleId} className="polaria-text-card-title text-polaria-w">
            Log de la orden
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 polaria-text-caption text-polaria-w-50 hover:bg-polaria-w-08 hover:text-polaria-w"
          >
            Cerrar
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <p className="polaria-text-body-sm text-polaria-w-50">Cargando…</p>
          ) : entries.length === 0 ? (
            <p className="polaria-text-body-sm text-polaria-w-50">
              Sin eventos registrados.
            </p>
          ) : (
            <ul className="space-y-0">
              {entries.map((entry) => (
                <LogLine key={entry.id} entry={entry} full />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Vista compacta del log: solo el último evento; click abre el historial completo.
 */
export function OrdenTrabajoLogPanel({
  idOrdenVenta,
  codigoCuenta,
  idOrdenTrabajo,
  createdAt,
  autorNombre,
}: OrdenTrabajoLogPanelProps) {
  const [entries, setEntries] = useState<OrdenVentaLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    void fetchOrdenVentaLog({
      idOrdenVenta,
      codigoCuenta,
      idOrdenTrabajo,
      createdAt,
      autor: autorNombre,
    })
      .then((rows) => {
        if (!cancelled) setEntries(filterLogEntriesVisible(rows));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [autorNombre, codigoCuenta, createdAt, idOrdenTrabajo, idOrdenVenta]);

  useEffect(() => load(), [load]);

  // entries vienen ordenados por created_at DESC (más reciente primero).
  const latest = entries[0] ?? null;

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="w-full rounded-xl border border-polaria-t-20 bg-polaria-bg/40 px-3 py-2.5 text-left transition hover:border-polaria-teal/50 hover:bg-polaria-t-08"
        aria-label="Ver log completo de la orden"
      >
        <p className="polaria-text-label uppercase tracking-wide text-polaria-teal">
          Log
        </p>
        {loading ? (
          <p className="mt-2 polaria-text-caption text-polaria-w-50">Cargando…</p>
        ) : !latest ? (
          <p className="mt-2 polaria-text-caption text-polaria-w-50">
            Sin eventos aún.
          </p>
        ) : (
          <ul className="mt-1">
            <LogLine entry={latest} />
          </ul>
        )}
        {latest ? (
          <p className="mt-2 polaria-text-caption text-polaria-teal">
            Ver historial completo
          </p>
        ) : null}
      </button>

      <OrdenTrabajoLogModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        entries={entries}
        loading={loading}
      />
    </>
  );
}
