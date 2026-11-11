"use client";

import { Loader2, MapPin, Search, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useBodyScrollLock } from "@/lib/utils/use-body-scroll-lock";
import { textoCoords, urlGoogleMaps } from "../../utils/pedido/entrega-mapa-links";
import { EntregaMapaModalAcciones } from "./EntregaMapaModalAcciones";
import { useEntregaMapa } from "./use-entrega-mapa";

export type EntregaMapaConfirmacion = {
  direccion: string;
  lat: number;
  lng: number;
};

type EntregaMapaModalProps = {
  open: boolean;
  onClose: () => void;
  direccionInicial: string;
  latInicial?: number | null;
  lngInicial?: number | null;
  modo: "editar" | "ver";
  onConfirm?: (value: EntregaMapaConfirmacion) => void;
};

export function EntregaMapaModal({
  open,
  onClose,
  direccionInicial,
  latInicial,
  lngInicial,
  modo,
  onConfirm,
}: EntregaMapaModalProps) {
  const titleId = useId();
  const [copiado, setCopiado] = useState(false);
  const mapa = useEntregaMapa({
    open,
    modo,
    direccionInicial,
    latInicial,
    lngInicial,
  });

  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    setCopiado(false);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function handleCopiar() {
    const texto =
      mapa.direccionResuelta.trim() ||
      (mapa.coords ? textoCoords(mapa.coords) : "") ||
      mapa.query.trim();
    if (!texto) return;
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 1600);
    } catch {
      mapa.setError("No se pudo copiar al portapapeles.");
    }
  }

  async function handleCompartir() {
    const texto =
      mapa.direccionResuelta.trim() ||
      (mapa.coords ? textoCoords(mapa.coords) : "") ||
      mapa.query.trim();
    if (!texto) return;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: "Dirección de entrega",
          text: texto,
          url: mapa.coords ? urlGoogleMaps(mapa.coords, texto) : undefined,
        });
        return;
      } catch {
        /* cancelado → copiar */
      }
    }
    await handleCopiar();
  }

  function handleConfirm() {
    if (!mapa.coords || !onConfirm) return;
    onConfirm({
      direccion: mapa.direccionResuelta.trim() || mapa.query.trim(),
      lat: mapa.coords.lat,
      lng: mapa.coords.lng,
    });
    onClose();
  }

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-polaria-bg/85 p-4 backdrop-blur-md"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[min(92vh,720px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-polaria-t-20 bg-polaria-bg shadow-[0_0_40px_var(--teal-glow)]"
      >
        <header className="flex items-start justify-between gap-3 border-b border-polaria-w-08 px-4 py-3">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="flex items-center gap-2 polaria-text-body font-semibold text-polaria-w"
            >
              <MapPin className="h-4 w-4 shrink-0 text-polaria-teal" aria-hidden />
              {modo === "editar" ? "Ubicar entrega" : "Ubicación de entrega"}
            </h2>
            <p className="mt-0.5 polaria-text-caption text-polaria-w-50">
              {modo === "editar"
                ? "Busca o haz clic en el mapa para marcar el punto."
                : "Punto guardado para esta orden de venta."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-lg border border-polaria-t-20 bg-polaria-t-08 p-2 text-polaria-w hover:bg-polaria-t-20"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </header>

        {modo === "editar" ? (
          <div className="flex flex-col gap-2 border-b border-polaria-w-08 px-4 py-3">
            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-polaria-w-20"
                  aria-hidden
                />
                <input
                  value={mapa.query}
                  onChange={(event) => mapa.setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void mapa.buscar();
                    }
                  }}
                  placeholder="Buscar dirección…"
                  className="w-full rounded-lg border border-polaria-w-08 bg-polaria-w-08 py-2 pl-9 pr-3 text-sm text-polaria-w placeholder:text-polaria-w-20 outline-none focus:border-polaria-t-20 focus:ring-1 focus:ring-polaria-t-20"
                />
              </div>
              <button
                type="button"
                onClick={() => void mapa.buscar()}
                disabled={mapa.buscando}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-polaria-teal px-3 py-2 text-sm font-semibold text-polaria-on-teal hover:opacity-90 disabled:opacity-60"
              >
                {mapa.buscando ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Search className="h-4 w-4" aria-hidden />
                )}
                Buscar
              </button>
            </div>
            {mapa.hits.length > 1 ? (
              <ul className="max-h-28 overflow-y-auto rounded-lg border border-polaria-w-08 bg-polaria-t-08">
                {mapa.hits.map((hit) => (
                  <li key={`${hit.lat}-${hit.lng}-${hit.displayName}`}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left polaria-text-caption text-polaria-w hover:bg-polaria-t-20"
                      onClick={() => mapa.elegirHit(hit)}
                    >
                      {hit.displayName}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <div className="relative min-h-[280px] flex-1 bg-polaria-w-08">
          <div ref={mapa.mapHostRef} className="absolute inset-0 z-0" />
          {!mapa.mapaListo ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-polaria-bg/60">
              <Loader2 className="h-6 w-6 animate-spin text-polaria-teal" />
            </div>
          ) : null}
        </div>

        <EntregaMapaModalAcciones
          modo={modo}
          coords={mapa.coords}
          direccionResuelta={mapa.direccionResuelta}
          query={mapa.query}
          error={mapa.error}
          copiado={copiado}
          onCopiar={() => void handleCopiar()}
          onCompartir={() => void handleCompartir()}
          onClose={onClose}
          onConfirm={handleConfirm}
        />
      </div>
    </div>,
    document.body,
  );
}
