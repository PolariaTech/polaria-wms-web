"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils/cn";
import { useBodyScrollLock } from "@/lib/utils/use-body-scroll-lock";
import { useShellOverlayStore } from "@/stores/shell-overlay.store";
import {
  cypherDockReserveClass,
  cypherDockRightClass,
} from "../../constants/cypher-layout";
import type { OrigenAdjunto } from "../../utils/origen/origen-adjuntos";
import { labelTipoOrigenAdjunto } from "../../utils/origen/origen-adjuntos";

function esAdjuntoImagen(item: OrigenAdjunto): boolean {
  const mime = (item.mime ?? "").toLowerCase();
  const name = item.nombre.toLowerCase();
  if (mime.startsWith("image/") && !name.endsWith(".pdf")) return true;
  return /\.(jpe?g|png|gif|webp|bmp)$/i.test(name);
}

export interface OrdenVentaAdjuntoPreviewModalProps {
  open: boolean;
  adjunto: OrigenAdjunto | null;
  viewUrl: string | null;
  onClose: () => void;
  /** Con Cypher abierto: panel a la izquierda (no tapa Cypher). */
  dockWithCypher?: boolean;
}

/**
 * REQ-266: preview dockeado sin nueva pestaña.
 * Usa blob URL (no iframe directo al API) porque next.config manda
 * X-Frame-Options: DENY y el navegador muestra «conexión rechazada».
 * Con dock, Cypher sigue clicable (cambiar de ojo sin cerrar).
 */
export function OrdenVentaAdjuntoPreviewModal({
  open,
  adjunto,
  viewUrl,
  onClose,
  dockWithCypher = false,
}: OrdenVentaAdjuntoPreviewModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const cypherWidthMode = useShellOverlayStore((s) => s.cypherWidthMode);
  const title = adjunto?.nombre?.trim() || "Adjunto";
  const tipo = adjunto ? labelTipoOrigenAdjunto(adjunto) : "";
  const esImagen = adjunto ? esAdjuntoImagen(adjunto) : false;

  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useBodyScrollLock(open);

  useEffect(() => {
    if (!open || !viewUrl || esImagen) {
      setObjectUrl(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    let created: string | null = null;
    setLoading(true);
    setError(null);
    setObjectUrl(null);

    void (async () => {
      try {
        const response = await fetch(viewUrl);
        if (!response.ok) {
          throw new Error(
            `No se pudo cargar el adjunto (${response.status}).`,
          );
        }
        const blob = await response.blob();
        if (cancelled) return;
        created = URL.createObjectURL(blob);
        setObjectUrl(created);
      } catch (err: unknown) {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo cargar el adjunto.",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (created) URL.revokeObjectURL(created);
    };
  }, [esImagen, open, viewUrl]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onClose, open]);

  if (!open || typeof document === "undefined") return null;

  const dockReserve = cypherDockReserveClass(cypherWidthMode);
  const dockRight = cypherDockRightClass(cypherWidthMode);

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[100] flex overflow-hidden",
        dockWithCypher
          ? cn(
              "pointer-events-none items-stretch justify-start pt-[var(--polaria-shell-top,4.75rem)]",
              dockReserve,
            )
          : "items-center justify-center px-4 py-6 sm:px-6 sm:py-10",
      )}
    >
      {dockWithCypher ? (
        <div
          aria-hidden
          className={cn(
            "absolute inset-0 bg-polaria-bg/80 backdrop-blur-sm",
            dockRight,
            "top-[var(--polaria-shell-top,4.75rem)]",
          )}
        />
      ) : (
        <button
          type="button"
          aria-label="Cerrar modal"
          className="absolute inset-0 bg-polaria-bg/80 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <div
        role="dialog"
        aria-modal={!dockWithCypher}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={cn(
          "relative z-10 flex min-h-0 min-w-0 flex-col overflow-hidden border-polaria-t-20 bg-polaria-t-08 backdrop-blur-xl",
          dockWithCypher
            ? "pointer-events-auto h-full w-full flex-1 rounded-none border-0 border-t border-r border-polaria-t-20 p-6 sm:p-8"
            : "polaria-card-glow w-full max-w-5xl max-h-[min(85dvh,calc(100dvh-5rem))] rounded-2xl border p-6 sm:p-8",
        )}
      >
        <div className="mb-6 flex shrink-0 items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id={titleId} className="polaria-text-card-title mt-1">
              {title}
            </h2>
            <p id={descriptionId} className="polaria-text-subtitle mt-2">
              {tipo
                ? `Vista previa · ${tipo}`
                : "Vista previa del archivo adjunto."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-polaria-w-08 px-3 py-1.5 polaria-text-body-sm text-polaria-w transition hover:border-polaria-t-20 hover:text-polaria-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg"
          >
            Cerrar
          </button>
        </div>

        <div className="polaria-scrollbar min-h-0 flex-1 overflow-hidden p-0">
          {!viewUrl ? (
            <div className="flex min-h-[16rem] items-center justify-center px-6 py-10 text-polaria-w-50">
              No hay archivo para mostrar.
            </div>
          ) : esImagen ? (
            <div className="flex min-h-[16rem] items-center justify-center bg-polaria-bg p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={viewUrl}
                alt={title}
                className="max-h-[min(72vh,48rem)] max-w-full object-contain"
              />
            </div>
          ) : loading ? (
            <div className="flex min-h-[16rem] items-center justify-center px-6 py-10 text-polaria-w-50">
              Cargando adjunto…
            </div>
          ) : error ? (
            <div
              role="alert"
              className="flex min-h-[16rem] items-center justify-center px-6 py-10 text-center text-polaria-danger"
            >
              {error}
            </div>
          ) : objectUrl ? (
            <iframe
              title={title}
              src={objectUrl}
              className="h-[min(72vh,48rem)] w-full border-0 bg-polaria-bg"
            />
          ) : (
            <div className="flex min-h-[16rem] items-center justify-center px-6 py-10 text-polaria-w-50">
              No hay archivo para mostrar.
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
