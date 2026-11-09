"use client";

import { ZoomIn, ZoomOut } from "lucide-react";
import {
  ADJUNTO_PREVIEW_ZOOM_MAX,
  ADJUNTO_PREVIEW_ZOOM_MIN,
  ADJUNTO_PREVIEW_ZOOM_STEP,
  clampAdjuntoPreviewZoom,
} from "./adjunto-preview-zoom";

const botonZoomClass =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-polaria-t-20 text-polaria-teal transition hover:bg-polaria-t-08 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg";

export function AdjuntoPreviewZoomControls(props: {
  zoom: number;
  onZoomChange: (next: number) => void;
}) {
  const { zoom, onZoomChange } = props;
  return (
    <div
      className="inline-flex shrink-0 items-center gap-1.5"
      role="group"
      aria-label="Zoom de la vista previa"
    >
      <button
        type="button"
        aria-label="Alejar"
        title="Alejar (−)"
        disabled={zoom <= ADJUNTO_PREVIEW_ZOOM_MIN}
        onClick={() =>
          onZoomChange(clampAdjuntoPreviewZoom(zoom - ADJUNTO_PREVIEW_ZOOM_STEP))
        }
        className={botonZoomClass}
      >
        <ZoomOut className="h-4 w-4" strokeWidth={1.75} />
      </button>
      <button
        type="button"
        aria-label="Restablecer zoom"
        title="Restablecer zoom"
        onClick={() => onZoomChange(1)}
        className="inline-flex h-9 min-w-12 shrink-0 items-center justify-center rounded-lg border border-polaria-t-20 px-2 polaria-text-body-sm text-polaria-w-50 transition hover:bg-polaria-t-08 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg"
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        type="button"
        aria-label="Acercar"
        title="Acercar (+)"
        disabled={zoom >= ADJUNTO_PREVIEW_ZOOM_MAX}
        onClick={() =>
          onZoomChange(clampAdjuntoPreviewZoom(zoom + ADJUNTO_PREVIEW_ZOOM_STEP))
        }
        className={botonZoomClass}
      >
        <ZoomIn className="h-4 w-4" strokeWidth={1.75} />
      </button>
    </div>
  );
}
