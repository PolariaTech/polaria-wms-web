"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { formatDateTime } from "@/components/shared/utils/formatters";
import { fetchOrdenVentaLog } from "../services/orden-venta-log.client";
import type { OrdenVentaLogEntry } from "../types/orden-venta-log.types";

interface OrdenTrabajoLogPanelProps {
  idOrdenVenta: string;
  codigoCuenta: string;
  createdAt?: string | null;
  autorNombre?: string | null;
}

function LogLine({ entry }: { entry: OrdenVentaLogEntry }) {
  return (
    <li className="min-w-0 border-b border-polaria-w-08 py-1.5 last:border-b-0">
      <p className="line-clamp-2 polaria-text-caption text-polaria-w">
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
                <LogLine key={entry.id} entry={entry} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Vista compacta del log (máx. 3) junto a la OT; click abre el historial completo.
 */
export function OrdenTrabajoLogPanel({
  idOrdenVenta,
  codigoCuenta,
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
      createdAt,
      autor: autorNombre,
    })
      .then((rows) => {
        if (!cancelled) setEntries(rows);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [autorNombre, codigoCuenta, createdAt, idOrdenVenta]);

  useEffect(() => load(), [load]);

  const preview = entries.slice(0, 3);

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
        ) : preview.length === 0 ? (
          <p className="mt-2 polaria-text-caption text-polaria-w-50">
            Sin eventos aún.
          </p>
        ) : (
          <ul className="mt-1">
            {preview.map((entry) => (
              <LogLine key={entry.id} entry={entry} />
            ))}
          </ul>
        )}
        <p className="mt-2 polaria-text-caption text-polaria-teal">
          Ver historial completo
        </p>
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
