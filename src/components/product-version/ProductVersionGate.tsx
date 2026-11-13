"use client";

import { useId, useState } from "react";
import { createPortal } from "react-dom";
import { useProductVersionCheck } from "@/hooks/shared/useProductVersionCheck";
import {
  ETIQUETA_ACEPTAR_NUEVA_VERSION,
  MENSAJE_NUEVA_VERSION_PRODUCTO,
} from "@/lib/product-version/product-version-constants";
import { reloadWithCacheClear } from "@/lib/product-version/reload-with-cache-clear";
import { useBodyScrollLock } from "@/lib/utils/use-body-scroll-lock";

/**
 * REQ-293: modal bloqueante por encima de cualquier pantalla cuando hay
 * deploy nuevo. Solo activo en producción (vía el hook).
 */
export function ProductVersionGate() {
  const { updateAvailable } = useProductVersionCheck();
  const [accepting, setAccepting] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  useBodyScrollLock(updateAvailable);

  if (!updateAvailable || typeof document === "undefined") return null;

  const handleAccept = () => {
    if (accepting) return;
    setAccepting(true);
    void reloadWithCacheClear().finally(() => {
      setAccepting(false);
    });
  };

  return createPortal(
    <div
      data-polaria-product-version-gate=""
      className="pointer-events-auto fixed inset-0 z-[400] flex items-center justify-center p-3 sm:p-6"
      role="presentation"
    >
      <div className="absolute inset-0 bg-polaria-bg/80" aria-hidden />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative z-10 w-full max-w-md rounded-2xl border border-polaria-t-20 bg-polaria-bg p-5 shadow-[var(--teal-glow-strong)]"
      >
        <h2
          id={titleId}
          className="polaria-text-title font-semibold text-polaria-w"
        >
          Nueva versión
        </h2>
        <p
          id={descriptionId}
          className="mt-3 polaria-text-body text-polaria-w-50"
        >
          {MENSAJE_NUEVA_VERSION_PRODUCTO}
        </p>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            disabled={accepting}
            onClick={handleAccept}
            className="rounded-xl bg-polaria-teal px-4 py-3 font-semibold text-polaria-on-teal hover:opacity-90 disabled:opacity-60"
          >
            {ETIQUETA_ACEPTAR_NUEVA_VERSION}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
