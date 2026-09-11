"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { CapturaOrdenUploadForm } from "./CapturaOrdenUploadForm";
import type { CapturaOrdenMetaView } from "./captura-orden.types";

function labelPrecision(precision: number): string {
  if (precision >= 85) return "Alta";
  if (precision >= 60) return "Media";
  if (precision >= 35) return "Baja";
  return "Muy baja";
}

interface CapturaOrdenCardProps {
  idOrdenVenta: string;
  meta: CapturaOrdenMetaView;
  flashOk: boolean;
  flashError: string | null;
  flashPrecision: number | null;
}

/**
 * Parte interactiva de la captura (cliente): puede ocultar el flash
 * viejo de la URL al elegir una foto nueva (caso típico en iPhone).
 */
export function CapturaOrdenCard({
  idOrdenVenta,
  meta,
  flashOk,
  flashError,
  flashPrecision,
}: CapturaOrdenCardProps) {
  const [hideFlash, setHideFlash] = useState(false);

  const onFilePicked = useCallback(() => {
    setHideFlash(true);
  }, []);

  const showOk = flashOk && !hideFlash;
  const showErr = Boolean(flashError) && !hideFlash;

  return (
    <section
      className={cn(
        "space-y-5 rounded-2xl border border-polaria-t-20 bg-polaria-t-08 p-5",
        "polaria-card-glow sm:p-6",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="polaria-text-label text-polaria-w-50">Folio</p>
          <p className="polaria-text-card-title mt-1 text-polaria-teal">
            {meta.folio}
          </p>
        </div>
        {meta.tieneCaptura || showOk ? (
          <span className="polaria-text-badge shrink-0 rounded-lg border border-polaria-t-20 bg-polaria-bg/60 px-2.5 py-1 text-polaria-teal">
            Ya capturada
          </span>
        ) : (
          <span className="polaria-text-badge shrink-0 rounded-lg border border-polaria-w-08 bg-polaria-bg/60 px-2.5 py-1 text-polaria-w-50">
            Pendiente
          </span>
        )}
      </div>

      {showOk ? (
        <div className="space-y-2 rounded-xl border border-polaria-t-20 bg-polaria-bg/40 px-3 py-3">
          <p className="polaria-text-body-sm text-polaria-teal">
            Listo. El operador ya puede descargar el PDF actualizado.
          </p>
          {flashPrecision != null ? (
            <p className="polaria-text-caption text-polaria-w-50">
              Precisión de extracción:{" "}
              <span className="font-semibold text-polaria-teal">
                {flashPrecision}% · {labelPrecision(flashPrecision)}
              </span>
            </p>
          ) : null}
        </div>
      ) : null}

      {showErr ? (
        <p
          role="alert"
          className="rounded-xl border border-polaria-w-08 bg-polaria-bg/40 px-3 py-2 polaria-text-body-sm text-polaria-w-50"
        >
          {flashError}
        </p>
      ) : null}

      {!showOk && meta.tieneCaptura ? (
        <p className="polaria-text-body-sm text-polaria-w-50">
          Hay una captura guardada
          {meta.capturaActualizadaEn
            ? ` (${new Date(meta.capturaActualizadaEn).toLocaleString("es-MX")})`
            : ""}
          . Puedes subir otra foto para reemplazarla.
        </p>
      ) : null}

      {!showOk && !meta.tieneCaptura ? (
        <p className="polaria-text-body-sm text-polaria-w-50">
          Aún no hay captura. Usa la cámara del teléfono o elige una imagen de
          la galería.
        </p>
      ) : null}

      <CapturaOrdenUploadForm
        idOrdenVenta={idOrdenVenta}
        onFilePicked={onFilePicked}
      />
    </section>
  );
}
