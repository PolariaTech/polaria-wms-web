"use client";

import { useCallback, useEffect, useState } from "react";
import { MateoIaLoadingMark } from "@/components/mateo/MateoIaLoadingMark";
import { CapturaOrdenUploadForm } from "./CapturaOrdenUploadForm";
import type { CapturaOrdenMetaView } from "./captura-orden.types";
import {
  CAPTURA_BUSY_PHRASES,
  CAPTURA_BUSY_PHRASE_MS,
  CAPTURA_DONE_PHRASE,
  CAPTURA_DONE_PHRASE_MS,
} from "./captura-busy-phrases";

interface CapturaOrdenCardProps {
  idOrdenVenta: string;
  idOrdenTrabajo: string;
  meta: CapturaOrdenMetaView;
  flashOk: boolean;
  flashError: string | null;
}

function CapturaCameraMark() {
  return (
    <div className="flex flex-col items-center text-center">
      <div
        className="relative mx-auto flex h-20 w-20 items-center justify-center"
        aria-hidden
      >
        <span className="absolute left-0 top-0 h-5 w-5 rounded-tl-md border-l-2 border-t-2 border-polaria-teal" />
        <span className="absolute right-0 top-0 h-5 w-5 rounded-tr-md border-r-2 border-t-2 border-polaria-teal" />
        <span className="absolute bottom-0 left-0 h-5 w-5 rounded-bl-md border-b-2 border-l-2 border-polaria-teal" />
        <span className="absolute bottom-0 right-0 h-5 w-5 rounded-br-md border-b-2 border-r-2 border-polaria-teal" />
        <svg
          viewBox="0 0 24 24"
          className="h-9 w-9 text-polaria-teal"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4.5 8.5h2.2l1.1-2h6.4l1.1 2H19.5A1.5 1.5 0 0 1 21 10v7.5A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5V10A1.5 1.5 0 0 1 4.5 8.5Z" />
          <circle cx="12" cy="13.5" r="3.1" />
        </svg>
      </div>
      <p className="polaria-text-card-title mt-3 text-polaria-w">Captura</p>
    </div>
  );
}

function CapturaListoMark() {
  return (
    <div
      className="flex flex-col items-center justify-center text-center"
      role="status"
      aria-live="polite"
    >
      <div
        className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-polaria-teal bg-polaria-t-08"
        aria-hidden
      >
        <svg
          viewBox="0 0 24 24"
          className="h-10 w-10 text-polaria-teal"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <p className="polaria-text-h3 mt-5 text-polaria-w">Listo</p>
    </div>
  );
}

function CapturaMateoBusy({ message }: { message: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex flex-col items-center justify-center py-6 text-center"
    >
      <div className="flex flex-col items-center rounded-3xl border border-polaria-t-20 bg-polaria-t-08 px-8 py-10">
        <MateoIaLoadingMark size="xl" tone="teal" showLabel />
        <p className="polaria-text-body mt-6 max-w-xs text-polaria-w-50">
          {message}
        </p>
      </div>
    </div>
  );
}

/**
 * Parte interactiva de la captura (cliente): puede ocultar el flash
 * viejo de la URL al elegir una foto nueva (caso típico en iPhone).
 * Si ya hay foto, el upsert del API la reemplaza (sin aviso en UI).
 */
export function CapturaOrdenCard({
  idOrdenVenta,
  idOrdenTrabajo,
  meta,
  flashOk,
  flashError,
}: CapturaOrdenCardProps) {
  const [hideFlash, setHideFlash] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [uploading, setUploading] = useState(false);
  /** Frase «Listo» un momento antes del check. */
  const [finishing, setFinishing] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);
  /** Vive en el card: al subir se desmonta el form y si no, se pierde el error. */
  const [uploadError, setUploadError] = useState<string | null>(null);

  const onFilePicked = useCallback(() => {
    setHideFlash(true);
    setUploadError(null);
    setFinishing(false);
    setPhraseIndex(0);
  }, []);

  const onUploadOk = useCallback(() => {
    setUploadError(null);
    setFinishing(true);
  }, []);

  const onUploadError = useCallback((message: string) => {
    setFinishing(false);
    setUploadError(message);
  }, []);

  useEffect(() => {
    if (!uploading || finishing) return;
    setPhraseIndex(0);
    const id = window.setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % CAPTURA_BUSY_PHRASES.length);
    }, CAPTURA_BUSY_PHRASE_MS);
    return () => window.clearInterval(id);
  }, [uploading, finishing]);

  useEffect(() => {
    if (!finishing) return;
    const id = window.setTimeout(() => {
      setUploadDone(true);
      setFinishing(false);
    }, CAPTURA_DONE_PHRASE_MS);
    return () => window.clearTimeout(id);
  }, [finishing]);

  const showOk = uploadDone || (flashOk && !hideFlash);
  const alertError =
    uploadError ||
    (Boolean(flashError) && !hideFlash && !showOk ? flashError : null);

  if (showOk) {
    return <CapturaListoMark />;
  }

  if (finishing) {
    return <CapturaMateoBusy message={CAPTURA_DONE_PHRASE} />;
  }

  if (uploading) {
    return (
      <CapturaMateoBusy message={CAPTURA_BUSY_PHRASES[phraseIndex] ?? CAPTURA_BUSY_PHRASES[0]} />
    );
  }

  return (
    <div className="space-y-6">
      <CapturaCameraMark />

      <section className="rounded-2xl border border-polaria-t-20 bg-polaria-t-08 px-4 py-3.5 text-center">
        <p className="polaria-text-card-title truncate text-polaria-w">
          {meta.folio}
        </p>
      </section>

      {alertError ? (
        <p
          role="alert"
          className="rounded-2xl border border-polaria-t-20 bg-polaria-t-08 px-4 py-3 text-center polaria-text-body-sm text-polaria-w"
        >
          {alertError}
          <span className="mt-1 block text-polaria-w-50">
            No se guardó esta captura. Encaja la hoja en el marco e intenta de
            nuevo.
          </span>
        </p>
      ) : null}

      <CapturaOrdenUploadForm
        idOrdenVenta={idOrdenVenta}
        idOrdenTrabajo={idOrdenTrabajo}
        onFilePicked={onFilePicked}
        onUploadOk={onUploadOk}
        onUploadError={onUploadError}
        onUploadingChange={setUploading}
      />
    </div>
  );
}
