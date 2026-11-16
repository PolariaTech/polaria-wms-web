"use client";

import { useEffect, useState } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";

interface OrdenVentaPdfPreviewModalProps {
  open: boolean;
  title: string;
  blob: Blob | null;
  isLoading?: boolean;
  error?: string | null;
  onClose: () => void;
  /** Con Cypher abierto: panel a la izquierda (no tapa Cypher). */
  dockWithCypher?: boolean;
}

const PDF_PREVIEW_TIMEOUT_MS = 45_000;

export function OrdenVentaPdfPreviewModal({
  open,
  title,
  blob,
  isLoading = false,
  error = null,
  onClose,
  dockWithCypher = false,
}: OrdenVentaPdfPreviewModalProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!open || !blob) {
      setObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(blob);
    setObjectUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [open, blob]);

  useEffect(() => {
    if (!open || !isLoading || blob || error) {
      setTimedOut(false);
      return;
    }
    const timer = window.setTimeout(() => setTimedOut(true), PDF_PREVIEW_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [open, isLoading, blob, error]);

  const errorVisible =
    error ||
    (timedOut
      ? "La generación del PDF está tardando demasiado. Cierra e inténtalo de nuevo."
      : null);

  return (
    <PolariaFormModal
      open={open}
      onClose={onClose}
      title={title}
      description="Vista previa de la orden de trabajo."
      asForm={false}
      hideFooter
      layout={dockWithCypher ? "dock-left" : "center"}
      stackLevel={dockWithCypher ? "base" : "nested"}
      closeOnBackdrop={!dockWithCypher}
      size="2xl"
      scrollClassName="max-h-[min(80vh,52rem)] overflow-hidden p-0"
      onSubmit={(event) => event.preventDefault()}
      error={errorVisible}
    >
      {isLoading && !timedOut ? (
        <div className="flex min-h-[24rem] items-center justify-center px-6 py-10 text-polaria-w-50">
          Generando PDF…
        </div>
      ) : objectUrl ? (
        <iframe
          title={title}
          src={objectUrl}
          className="h-[min(72vh,48rem)] w-full border-0 bg-polaria-bg"
        />
      ) : (
        <div className="flex min-h-[16rem] items-center justify-center px-6 py-10 text-polaria-w-50">
          No hay PDF para mostrar.
        </div>
      )}
    </PolariaFormModal>
  );
}
