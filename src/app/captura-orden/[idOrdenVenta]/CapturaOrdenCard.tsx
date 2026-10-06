"use client";

import { useCallback, useEffect, useId, useState } from "react";
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
  idOrdenTrabajo: string;
  meta: CapturaOrdenMetaView;
  flashOk: boolean;
  flashError: string | null;
  flashPrecision: number | null;
}

function CapturaYaCapturadaDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
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
      className="fixed inset-0 z-[100] flex items-center justify-center p-6"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-polaria-bg/80 backdrop-blur-sm"
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-xs rounded-2xl border border-polaria-t-20 bg-polaria-t-08 px-5 py-6 text-center"
      >
        <h2 id={titleId} className="polaria-text-card-title">
          Ya capturada
        </h2>
        <p className="polaria-text-body-sm mt-2 text-polaria-w-50">
          Esta hoja ya tiene foto. Puedes reemplazarla.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-full bg-polaria-teal px-4 py-3 font-semibold text-polaria-bg hover:opacity-90"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}

/**
 * Parte interactiva de la captura (cliente): puede ocultar el flash
 * viejo de la URL al elegir una foto nueva (caso típico en iPhone).
 */
export function CapturaOrdenCard({
  idOrdenVenta,
  idOrdenTrabajo,
  meta,
  flashOk,
  flashError,
  flashPrecision,
}: CapturaOrdenCardProps) {
  const [hideFlash, setHideFlash] = useState(false);
  const [avisoAbierto, setAvisoAbierto] = useState(
    () => meta.tieneCaptura && !flashOk,
  );

  const onFilePicked = useCallback(() => {
    setHideFlash(true);
    setAvisoAbierto(false);
  }, []);

  const showOk = flashOk && !hideFlash;
  const showErr = Boolean(flashError) && !hideFlash;

  return (
    <div className="space-y-6">
      <CapturaYaCapturadaDialog
        open={avisoAbierto}
        onClose={() => setAvisoAbierto(false)}
      />

      <section className="rounded-2xl border border-polaria-t-20 bg-polaria-t-08 px-4 py-3.5">
        <p className="polaria-text-label text-polaria-w-50">Orden de trabajo</p>
        <p className="polaria-text-card-title mt-0.5 truncate text-polaria-w">
          {meta.folio}
        </p>
      </section>

      {showOk ? (
        <p className="text-center polaria-text-body-sm text-polaria-teal">
          Listo
          {flashPrecision != null
            ? ` · ${flashPrecision}% ${labelPrecision(flashPrecision)}`
            : ""}
          .
        </p>
      ) : null}

      {showErr ? (
        <p
          role="alert"
          className="text-center polaria-text-body-sm text-polaria-w-50"
        >
          {flashError}
        </p>
      ) : null}

      <CapturaOrdenUploadForm
        idOrdenVenta={idOrdenVenta}
        idOrdenTrabajo={idOrdenTrabajo}
        onFilePicked={onFilePicked}
      />
    </div>
  );
}
