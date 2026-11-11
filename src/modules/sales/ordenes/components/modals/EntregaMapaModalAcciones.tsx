"use client";

import { Copy, ExternalLink, Navigation, Share2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  textoCoords,
  urlGoogleMaps,
  urlWaze,
  type EntregaCoords,
} from "../../utils/pedido/entrega-mapa-links";

const accionBtnClass =
  "inline-flex items-center gap-1.5 rounded-lg border border-polaria-t-20 bg-polaria-t-08 px-2.5 py-1.5 polaria-text-caption font-medium text-polaria-w hover:bg-polaria-t-20";

type EntregaMapaModalAccionesProps = {
  modo: "editar" | "ver";
  coords: EntregaCoords | null;
  direccionResuelta: string;
  query: string;
  error: string | null;
  copiado: boolean;
  onCopiar: () => void;
  onCompartir: () => void;
  onClose: () => void;
  onConfirm?: () => void;
};

export function EntregaMapaModalAcciones({
  modo,
  coords,
  direccionResuelta,
  query,
  error,
  copiado,
  onCopiar,
  onCompartir,
  onClose,
  onConfirm,
}: EntregaMapaModalAccionesProps) {
  const texto =
    direccionResuelta.trim() ||
    (coords ? textoCoords(coords) : "") ||
    query.trim();

  return (
    <div className="space-y-2 border-t border-polaria-w-08 px-4 py-3">
      {texto ? (
        <p className="break-words polaria-text-body-sm text-polaria-w">{texto}</p>
      ) : (
        <p className="polaria-text-caption text-polaria-w-50">
          Sin ubicación marcada todavía.
        </p>
      )}
      {coords ? (
        <p className="polaria-text-caption tabular-nums text-polaria-w-50">
          {textoCoords(coords)}
        </p>
      ) : null}
      {error ? (
        <p className="polaria-text-caption text-polaria-danger">{error}</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {coords ? (
          <>
            <a
              href={urlWaze(coords)}
              target="_blank"
              rel="noreferrer"
              className={accionBtnClass}
            >
              <Navigation className="h-3.5 w-3.5" aria-hidden />
              Waze
            </a>
            <a
              href={urlGoogleMaps(coords, direccionResuelta)}
              target="_blank"
              rel="noreferrer"
              className={accionBtnClass}
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              Google Maps
            </a>
          </>
        ) : null}
        <button type="button" onClick={onCopiar} className={accionBtnClass}>
          <Copy className="h-3.5 w-3.5" aria-hidden />
          {copiado ? "Copiado" : "Copiar dirección"}
        </button>
        <button type="button" onClick={onCompartir} className={accionBtnClass}>
          <Share2 className="h-3.5 w-3.5" aria-hidden />
          Compartir
        </button>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-polaria-t-20 bg-polaria-t-08 px-3 py-2 text-sm font-medium text-polaria-w hover:bg-polaria-t-20"
          >
            {modo === "ver" ? "Cerrar" : "Cancelar"}
          </button>
          {modo === "editar" ? (
            <button
              type="button"
              disabled={!coords}
              onClick={onConfirm}
              className={cn(
                "rounded-lg bg-polaria-teal px-3 py-2 text-sm font-semibold text-polaria-on-teal hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              Usar esta ubicación
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
