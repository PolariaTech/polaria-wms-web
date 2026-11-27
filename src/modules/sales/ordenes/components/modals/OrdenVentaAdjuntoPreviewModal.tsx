"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { PolariaRemoteImage } from "@/components/shared/media/PolariaRemoteImage";
import { cn } from "@/lib/utils/cn";
import { useBodyScrollLock } from "@/lib/utils/use-body-scroll-lock";
import { cypherPanelWidthClass } from "../../constants/cypher-layout";
import type { OrigenAdjunto } from "../../utils/origen/origen-adjuntos";
import { labelTipoOrigenAdjunto } from "../../utils/origen/origen-adjuntos";
import { AdjuntoPreviewZoomControls } from "./AdjuntoPreviewZoomControls";
import {
  ADJUNTO_PREVIEW_ZOOM_DEFAULT,
  htmlFitZoom,
  withBrowserPdfZoom,
} from "./adjunto-preview-zoom";
import { CypherResizeRail } from "./CypherResizeRail";
import { useCypherDrawerResize } from "./cypher-drawer-resize";
import {
  buildAdjuntoHtmlSrcDoc,
  buildAdjuntoZoomStyle,
  esAdjuntoHtmlResponse,
  esAdjuntoImagen,
} from "./OrdenVentaAdjuntoPreviewModal-helpers";

export interface OrdenVentaAdjuntoPreviewModalProps {
  open: boolean;
  adjunto: OrigenAdjunto | null;
  viewUrl: string | null;
  onClose: () => void;
  /** Con Cypher abierto: preview en el panel derecho (REQ-293); la edición a la izquierda sigue usable. */
  dockWithCypher?: boolean;
}

/**
 * REQ-266/293: preview dockeado sin nueva pestaña.
 * Usa blob URL (no iframe directo al API) porque next.config manda
 * X-Frame-Options: DENY y el navegador muestra «conexión rechazada».
 * Con dock, el formulario de edición (izquierda) sigue editable.
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
  const {
    cypherWidthMode,
    isResizingWidth,
    handleResizePointerDown,
    handleResizePointerMove,
    handleResizePointerUp,
  } = useCypherDrawerResize();
  const title = adjunto?.nombre?.trim() || "Adjunto";
  const tipo = adjunto ? labelTipoOrigenAdjunto(adjunto) : "";
  const esImagen = adjunto ? esAdjuntoImagen(adjunto) : false;
  const esPdf = Boolean(
    adjunto &&
      ((adjunto.mime ?? "").toLowerCase() === "application/pdf" ||
        adjunto.nombre.toLowerCase().endsWith(".pdf")),
  );

  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [htmlSrcDoc, setHtmlSrcDoc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(ADJUNTO_PREVIEW_ZOOM_DEFAULT);

  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    setZoom(ADJUNTO_PREVIEW_ZOOM_DEFAULT);
  }, [open, adjunto?.nombre, adjunto?.path, adjunto?.url]);

  useEffect(() => {
    if (!open || !viewUrl || esImagen) {
      setObjectUrl(null);
      setHtmlSrcDoc(null);
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
        const esHtml = esAdjuntoHtmlResponse(
          response.headers?.get("content-type"),
          adjunto?.nombre,
        );
        if (esHtml) {
          const html = await response.text();
          if (cancelled) return;
          setHtmlSrcDoc(buildAdjuntoHtmlSrcDoc(html));
          setObjectUrl(null);
        } else {
          const blob = await response.blob();
          if (cancelled) return;
          created = URL.createObjectURL(blob);
          setObjectUrl(created);
          setHtmlSrcDoc(null);
        }
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
  }, [adjunto?.nombre, esImagen, open, viewUrl]);

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

  const panelWidth = cypherPanelWidthClass(cypherWidthMode);
  const zoomStyle = esPdf ? undefined : buildAdjuntoZoomStyle(zoom);
  const iframeSrc =
    objectUrl && esPdf ? withBrowserPdfZoom(objectUrl, "fit") : objectUrl;

  return createPortal(
    <div
      className={cn(
        // REQ-330: dock por encima del Cypher (z-110) para cubrir el panel y
        // exponer el rail de resize del documento.
        "fixed inset-0 flex overflow-hidden",
        dockWithCypher ? "z-[120]" : "z-[100]",
        dockWithCypher
          ? "pointer-events-none items-stretch justify-end pt-[var(--polaria-shell-top,4.75rem)]"
          : "items-center justify-center px-4 py-6 sm:px-6 sm:py-10",
      )}
    >
      {dockWithCypher ? null : (
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
            ? cn(
                "pointer-events-auto h-full rounded-none border-0 border-l border-t border-polaria-t-20 p-6 sm:p-8",
                "box-border will-change-transform",
                isResizingWidth
                  ? "transition-transform duration-[320ms] ease-out"
                  : "transition-[transform,width,max-width] duration-[320ms] ease-out",
                panelWidth,
              )
            : "polaria-card-glow w-full max-w-5xl max-h-[min(85dvh,calc(100dvh-5rem))] rounded-2xl border p-6 sm:p-8",
        )}
      >
        {dockWithCypher ? (
          <CypherResizeRail
            isResizingWidth={isResizingWidth}
            onPointerDown={handleResizePointerDown}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
          />
        ) : null}
        <div className="mb-6 flex shrink-0 items-start gap-3">
          <div className="min-w-0 flex-1 overflow-hidden">
            <h2
              id={titleId}
              title={title}
              className="polaria-text-card-title mt-1 truncate"
            >
              {title}
            </h2>
            <p id={descriptionId} className="polaria-text-subtitle mt-2 truncate">
              {tipo
                ? `Vista previa · ${tipo}`
                : "Vista previa del archivo adjunto."}
            </p>
          </div>
          <div className="relative z-10 flex shrink-0 items-center gap-2">
            <AdjuntoPreviewZoomControls
              zoom={zoom}
              etiqueta={
                esPdf && zoom === ADJUNTO_PREVIEW_ZOOM_DEFAULT
                  ? "Ancho"
                  : undefined
              }
              onZoomChange={setZoom}
            />
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg border border-polaria-w-08 px-3 py-1.5 polaria-text-body-sm text-polaria-w transition hover:border-polaria-t-20 hover:text-polaria-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg"
            >
              Cerrar
            </button>
          </div>
        </div>

        <div className="relative min-h-0 flex-1 bg-polaria-bg">
          {!viewUrl ? (
            <div className="flex h-full min-h-[16rem] items-center justify-center px-6 py-10 text-polaria-w-50">
              No hay archivo para mostrar.
            </div>
          ) : esImagen ? (
            <div className="polaria-scrollbar absolute inset-0 overflow-auto p-4">
              <div style={zoomStyle}>
                <PolariaRemoteImage
                  src={viewUrl}
                  alt={title}
                  width={1400}
                  height={1000}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </div>
          ) : loading ? (
            <div className="flex h-full min-h-[16rem] items-center justify-center px-6 py-10 text-polaria-w-50">
              Cargando adjunto…
            </div>
          ) : error ? (
            <div
              role="alert"
              className="flex h-full min-h-[16rem] items-center justify-center px-6 py-10 text-center text-polaria-danger"
            >
              {error}
            </div>
          ) : htmlSrcDoc ? (
            <div className="absolute inset-0 overflow-hidden">
              <iframe
                title={title}
                srcDoc={htmlSrcDoc}
                sandbox="allow-same-origin"
                style={zoomStyle}
                className="block border-0 bg-white"
                onLoad={(event) => {
                  const frame = event.currentTarget;
                  const fit = htmlFitZoom(
                    frame.clientWidth,
                    frame.contentDocument?.documentElement.scrollWidth ?? 0,
                  );
                  if (fit != null) setZoom(fit);
                }}
              />
            </div>
          ) : objectUrl ? (
            <div className="absolute inset-0 overflow-auto">
              <iframe
                title={title}
                src={iframeSrc ?? undefined}
                className="block border-0 bg-polaria-bg"
                style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%` }}
              />
            </div>
          ) : (
            <div className="flex h-full min-h-[16rem] items-center justify-center px-6 py-10 text-polaria-w-50">
              No hay archivo para mostrar.
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
