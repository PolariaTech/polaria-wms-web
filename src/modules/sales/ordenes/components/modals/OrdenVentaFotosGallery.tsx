import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import { PolariaRemoteImage } from "@/components/shared/media/PolariaRemoteImage";
import { formatDateTime } from "@/components/shared/utils/formatters";
import type { OrdenVentaFotoCapturaItem } from "./orden-venta-fotos-captura.types";
import type { useOrdenVentaFotosViewer } from "./use-orden-venta-fotos-viewer";

type ViewerState = ReturnType<typeof useOrdenVentaFotosViewer>;

export function OrdenVentaFotosGallery({
  fotos,
  isLoadingFotos,
  allowBackToOts,
  onBackToOts,
  viewer,
}: {
  fotos: OrdenVentaFotoCapturaItem[];
  isLoadingFotos: boolean;
  allowBackToOts: boolean;
  onBackToOts: () => void;
  viewer: ViewerState;
}) {
  const {
    index,
    zoom,
    pan,
    isPanning,
    resetView,
    goPrev,
    goNext,
    setZoomClamped,
    onPanPointerDown,
    onPanPointerMove,
    onPanPointerUp,
    selectIndex,
    onGalleryWheel,
  } = viewer;

  const active = fotos[index] ?? null;
  const when = active?.createdAt ?? active?.updatedAt ?? null;

  return (
    <div className="space-y-4">
      {allowBackToOts ? (
        <button
          type="button"
          onClick={onBackToOts}
          className="rounded-lg border border-polaria-t-20 px-3 py-1.5 text-polaria-teal transition hover:bg-polaria-t-08 polaria-text-body-sm"
        >
          ← Órdenes de tarea
        </button>
      ) : null}

      {isLoadingFotos ? (
        <div className="flex min-h-[16rem] items-center justify-center py-10 text-polaria-w-50">
          Cargando fotos…
        </div>
      ) : fotos.length === 0 ? (
        <div className="flex min-h-[16rem] items-center justify-center py-10 text-polaria-w-50">
          Esta orden de trabajo no tiene fotos en el historial.
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-polaria-w-50 polaria-text-body-sm">
              Foto {index + 1} de {fotos.length}
              {when ? ` · ${formatDateTime(when)}` : ""}
              {index === 0 ? " · más reciente" : ""}
            </p>
            <div className="inline-flex items-center gap-1.5">
              <button
                type="button"
                aria-label="Alejar"
                title="Alejar (−)"
                onClick={() => setZoomClamped(zoom - 0.25)}
                disabled={zoom <= 1}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-polaria-t-20 text-polaria-teal transition hover:bg-polaria-t-08 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ZoomOut className="h-4 w-4" strokeWidth={1.75} />
              </button>
              <button
                type="button"
                aria-label="Restablecer zoom"
                title="Restablecer (0)"
                onClick={resetView}
                className="inline-flex h-9 min-w-12 items-center justify-center rounded-lg border border-polaria-t-20 px-2 text-polaria-w-50 transition hover:bg-polaria-t-08 polaria-text-body-sm"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                aria-label="Acercar"
                title="Acercar (+)"
                onClick={() => setZoomClamped(zoom + 0.25)}
                disabled={zoom >= 4}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-polaria-t-20 text-polaria-teal transition hover:bg-polaria-t-08 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ZoomIn className="h-4 w-4" strokeWidth={1.75} />
              </button>
              <button
                type="button"
                aria-label="Restablecer vista"
                title="Restablecer vista"
                onClick={resetView}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-polaria-t-20 text-polaria-teal transition hover:bg-polaria-t-08"
              >
                <RotateCcw className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-polaria-t-20 bg-polaria-bg">
            <div
              className={`flex max-h-[min(56vh,36rem)] min-h-[16rem] items-center justify-center overflow-hidden p-2 touch-none ${
                zoom > 1
                  ? isPanning
                    ? "cursor-grabbing"
                    : "cursor-grab"
                  : ""
              }`}
              onPointerDown={onPanPointerDown}
              onPointerMove={onPanPointerMove}
              onPointerUp={onPanPointerUp}
              onPointerCancel={onPanPointerUp}
              onWheel={onGalleryWheel}
            >
              {active ? (
                <PolariaRemoteImage
                  src={active.urlFoto}
                  alt={`Foto ${index + 1}`}
                  draggable={false}
                  width={1200}
                  height={900}
                  className={`max-h-[min(52vh,34rem)] w-auto origin-center object-contain select-none ${
                    isPanning ? "" : "transition-transform duration-150"
                  }`}
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  }}
                />
              ) : null}
            </div>

            {fotos.length > 1 ? (
              <>
                <button
                  type="button"
                  aria-label="Foto anterior"
                  onClick={goPrev}
                  className="absolute left-2 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-polaria-t-20 bg-polaria-bg/90 text-polaria-teal shadow-lg backdrop-blur-sm transition hover:bg-polaria-t-08"
                >
                  <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  aria-label="Foto siguiente"
                  onClick={goNext}
                  className="absolute right-2 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-polaria-t-20 bg-polaria-bg/90 text-polaria-teal shadow-lg backdrop-blur-sm transition hover:bg-polaria-t-08"
                >
                  <ChevronRight className="h-5 w-5" strokeWidth={1.75} />
                </button>
              </>
            ) : null}
          </div>

          {fotos.length > 1 ? (
            <ul className="flex gap-2 overflow-x-auto pb-1">
              {fotos.map((foto, fotoIndex) => {
                const isActive = fotoIndex === index;
                const key = foto.idFoto ?? `${foto.urlFoto}-${fotoIndex}`;
                return (
                  <li key={key} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => selectIndex(fotoIndex)}
                      className={`overflow-hidden rounded-lg border transition ${
                        isActive
                          ? "border-polaria-teal ring-1 ring-polaria-teal"
                          : "border-polaria-t-20 hover:border-polaria-teal"
                      }`}
                    >
                      <PolariaRemoteImage
                        src={foto.urlFoto}
                        alt={`Miniatura ${fotoIndex + 1}`}
                        width={80}
                        height={64}
                        className="h-16 w-20 object-cover"
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}

          <p className="text-center text-polaria-w-20 polaria-text-body-sm">
            {zoom > 1
              ? "Arrastra para mover · rueda para desplazar · flechas para pan · + / − zoom · 0 restablecer"
              : "Flechas ← → para cambiar foto · + / − para zoom · 0 para restablecer"}
          </p>
        </div>
      )}
    </div>
  );
}