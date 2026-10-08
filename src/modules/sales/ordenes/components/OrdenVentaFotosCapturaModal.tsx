"use client";

import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { formatDateTime } from "@/components/shared/utils/formatters";
import { parseIdOrdenTrabajoFields } from "../utils/origen-correo-ordenes-trabajo";

export interface OrdenVentaFotoCapturaItem {
  idFoto?: string;
  idOrdenTrabajo?: string;
  urlFoto: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface OrdenVentaOtConFotosItem {
  idOrdenTrabajo: string;
  totalFotos: number;
  ultimaAt: string;
  previewUrl: string;
  label?: string;
  numeroPedido?: string;
  centroConsumo?: string;
}

interface OrdenVentaFotosCapturaModalProps {
  open: boolean;
  title: string;
  ordenesTrabajo: OrdenVentaOtConFotosItem[];
  fotos: OrdenVentaFotoCapturaItem[];
  selectedOt: string | null;
  isLoadingOts?: boolean;
  isLoadingFotos?: boolean;
  error?: string | null;
  onSelectOt: (idOrdenTrabajo: string) => void;
  onBackToOts: () => void;
  onClose: () => void;
}

function resolveOtDisplay(ot: {
  idOrdenTrabajo: string;
  label?: string;
  numeroPedido?: string;
  centroConsumo?: string;
}) {
  const parsed = parseIdOrdenTrabajoFields(ot.idOrdenTrabajo);
  return {
    label: ot.label?.trim() || parsed.label,
    numeroPedido: ot.numeroPedido?.trim() || parsed.numeroPedido,
    centroConsumo: ot.centroConsumo?.trim() || parsed.centroConsumo,
  };
}

export function OrdenVentaFotosCapturaModal({
  open,
  title,
  ordenesTrabajo,
  fotos,
  selectedOt,
  isLoadingOts = false,
  isLoadingFotos = false,
  error = null,
  onSelectOt,
  onBackToOts,
  onClose,
}: OrdenVentaFotosCapturaModalProps) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const showingFotos = selectedOt !== null;
  const selectedDisplay = selectedOt
    ? resolveOtDisplay({ idOrdenTrabajo: selectedOt })
    : null;

  useEffect(() => {
    if (!open || !showingFotos) {
      setIndex(0);
      setZoom(1);
      return;
    }
    setIndex(0);
    setZoom(1);
  }, [open, showingFotos, selectedOt, fotos]);

  const goPrev = useCallback(() => {
    setIndex((current) => {
      if (fotos.length <= 1) return current;
      return (current - 1 + fotos.length) % fotos.length;
    });
    setZoom(1);
  }, [fotos.length]);

  const goNext = useCallback(() => {
    setIndex((current) => {
      if (fotos.length <= 1) return current;
      return (current + 1) % fotos.length;
    });
    setZoom(1);
  }, [fotos.length]);

  useEffect(() => {
    if (!open || !showingFotos || fotos.length === 0) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      } else if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        setZoom((z) => Math.min(4, Number((z + 0.25).toFixed(2))));
      } else if (event.key === "-") {
        event.preventDefault();
        setZoom((z) => Math.max(1, Number((z - 0.25).toFixed(2))));
      } else if (event.key === "0") {
        event.preventDefault();
        setZoom(1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, showingFotos, fotos.length, goPrev, goNext]);

  const description = showingFotos
    ? selectedDisplay?.centroConsumo
      ? `Historial · Pedido ${selectedDisplay.numeroPedido || "—"} · Centro ${selectedDisplay.centroConsumo}`
      : `Historial · ${selectedDisplay?.label ?? "OT"}`
    : "Elige la orden de trabajo para ver su historial de fotos.";

  const active = fotos[index] ?? null;
  const when = active?.createdAt ?? active?.updatedAt ?? null;

  return (
    <PolariaFormModal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      asForm={false}
      hideFooter
      size="2xl"
      scrollClassName="max-h-[min(80vh,52rem)] overflow-y-auto"
      onSubmit={(event) => event.preventDefault()}
      error={error}
    >
      {showingFotos ? (
        <div className="space-y-4">
          <button
            type="button"
            onClick={onBackToOts}
            className="rounded-lg border border-polaria-t-20 px-3 py-1.5 text-polaria-teal transition hover:bg-polaria-t-08 polaria-text-body-sm"
          >
            ← Órdenes de trabajo
          </button>

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
                    onClick={() =>
                      setZoom((z) => Math.max(1, Number((z - 0.25).toFixed(2))))
                    }
                    disabled={zoom <= 1}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-polaria-t-20 text-polaria-teal transition hover:bg-polaria-t-08 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ZoomOut className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                  <button
                    type="button"
                    aria-label="Restablecer zoom"
                    title="Restablecer (0)"
                    onClick={() => setZoom(1)}
                    className="inline-flex h-9 min-w-12 items-center justify-center rounded-lg border border-polaria-t-20 px-2 text-polaria-w-50 transition hover:bg-polaria-t-08 polaria-text-body-sm"
                  >
                    {Math.round(zoom * 100)}%
                  </button>
                  <button
                    type="button"
                    aria-label="Acercar"
                    title="Acercar (+)"
                    onClick={() =>
                      setZoom((z) => Math.min(4, Number((z + 0.25).toFixed(2))))
                    }
                    disabled={zoom >= 4}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-polaria-t-20 text-polaria-teal transition hover:bg-polaria-t-08 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ZoomIn className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                  <button
                    type="button"
                    aria-label="Restablecer vista"
                    title="Restablecer vista"
                    onClick={() => setZoom(1)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-polaria-t-20 text-polaria-teal transition hover:bg-polaria-t-08"
                  >
                    <RotateCcw className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-xl border border-polaria-t-20 bg-polaria-bg">
                <div
                  className="flex max-h-[min(56vh,36rem)] min-h-[16rem] items-center justify-center overflow-auto p-2"
                  onWheel={(event) => {
                    if (!event.ctrlKey && !event.metaKey) return;
                    event.preventDefault();
                    const delta = event.deltaY > 0 ? -0.1 : 0.1;
                    setZoom((z) =>
                      Math.min(4, Math.max(1, Number((z + delta).toFixed(2)))),
                    );
                  }}
                >
                  {active ? (
                    // eslint-disable-next-line @next/next/no-img-element -- URL externa Cloudinary
                    <img
                      src={active.urlFoto}
                      alt={`Foto ${index + 1}`}
                      draggable={false}
                      className="max-h-[min(52vh,34rem)] w-auto origin-center object-contain transition-transform duration-150"
                      style={{ transform: `scale(${zoom})` }}
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
                          onClick={() => {
                            setIndex(fotoIndex);
                            setZoom(1);
                          }}
                          className={`overflow-hidden rounded-lg border transition ${
                            isActive
                              ? "border-polaria-teal ring-1 ring-polaria-teal"
                              : "border-polaria-t-20 hover:border-polaria-teal"
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element -- URL externa Cloudinary */}
                          <img
                            src={foto.urlFoto}
                            alt={`Miniatura ${fotoIndex + 1}`}
                            className="h-16 w-20 object-cover"
                          />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}

              <p className="text-center text-polaria-w-20 polaria-text-body-sm">
                Flechas ← → para cambiar · + / − para zoom · 0 para restablecer
              </p>
            </div>
          )}
        </div>
      ) : isLoadingOts ? (
        <div className="flex min-h-[16rem] items-center justify-center py-10 text-polaria-w-50">
          Cargando órdenes de trabajo…
        </div>
      ) : ordenesTrabajo.length === 0 ? (
        <div className="flex min-h-[16rem] items-center justify-center py-10 text-polaria-w-50">
          Aún no hay fotos. El jefe debe escanear el QR y subir la hoja.
        </div>
      ) : (
        <ul className="space-y-3">
          {ordenesTrabajo.map((ot) => {
            const display = resolveOtDisplay(ot);
            return (
              <li key={ot.idOrdenTrabajo || "__sin_ot__"}>
                <button
                  type="button"
                  onClick={() => onSelectOt(ot.idOrdenTrabajo)}
                  className="flex w-full items-center gap-3 overflow-hidden rounded-xl border border-polaria-t-20 bg-polaria-t-08 p-3 text-left transition hover:border-polaria-teal"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- URL externa Cloudinary */}
                  <img
                    src={ot.previewUrl}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-lg object-cover"
                  />
                  <span className="min-w-0 flex-1 space-y-1">
                    {display.numeroPedido ? (
                      <span className="block truncate font-medium text-polaria-w">
                        Pedido {display.numeroPedido}
                      </span>
                    ) : (
                      <span className="block truncate font-medium text-polaria-w">
                        {display.label}
                      </span>
                    )}
                    {display.centroConsumo ? (
                      <span className="block truncate text-polaria-teal polaria-text-body-sm">
                        Centro de consumo: {display.centroConsumo}
                      </span>
                    ) : null}
                    <span className="block text-polaria-w-50 polaria-text-body-sm">
                      {ot.totalFotos}{" "}
                      {ot.totalFotos === 1 ? "foto" : "fotos"}
                      {ot.ultimaAt
                        ? ` · última ${formatDateTime(ot.ultimaAt)}`
                        : ""}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </PolariaFormModal>
  );
}
