"use client";

import { useEffect, useId, useRef, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/config/routes";
import { expireLocalAuth } from "@/lib/auth/auth-sync";
import {
  ETIQUETA_ACEPTAR_SESION_EXPIRADA,
  MENSAJE_SESION_EXPIRADA,
  TITULO_SESION_EXPIRADA,
} from "@/lib/auth/session-expired";
import { useBodyScrollLock } from "@/lib/utils/use-body-scroll-lock";
import { useSessionExpiredStore } from "@/stores/session-expired.store";

/**
 * Modal bloqueante por encima de cualquier pantalla cuando el API rechaza el
 * token y no se puede renovar. No se cierra con Escape ni con clic fuera:
 * la única salida es «Aceptar», que cierra la sesión local y lleva a /login.
 */
export function SessionExpiredGate() {
  const isOpen = useSessionExpiredStore((state) => state.isOpen);
  const close = useSessionExpiredStore((state) => state.close);
  const router = useRouter();
  const acceptButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (isOpen) acceptButtonRef.current?.focus();
  }, [isOpen]);

  if (!isOpen || typeof document === "undefined") return null;

  const handleAccept = () => {
    // El token ya no es válido: basta limpiar la sesión local, no hay nada que revocar.
    expireLocalAuth();
    close();
    router.replace(ROUTES.login);
  };

  // Un único control enfocable: Tab no puede sacar el foco del modal.
  const keepFocusInside = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") return;
    event.preventDefault();
    acceptButtonRef.current?.focus();
  };

  return createPortal(
    <div
      data-polaria-session-expired-gate=""
      className="pointer-events-auto fixed inset-0 z-[400] flex items-center justify-center p-3 sm:p-6"
      role="presentation"
    >
      <div className="absolute inset-0 bg-polaria-bg/80" aria-hidden />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onKeyDown={keepFocusInside}
        className="relative z-10 w-full max-w-md rounded-2xl border border-polaria-t-20 bg-polaria-bg p-5 shadow-[var(--teal-glow-strong)]"
      >
        <h2
          id={titleId}
          className="polaria-text-title font-semibold text-polaria-w"
        >
          {TITULO_SESION_EXPIRADA}
        </h2>
        <p
          id={descriptionId}
          className="mt-3 polaria-text-body text-polaria-w-50"
        >
          {MENSAJE_SESION_EXPIRADA}
        </p>
        <div className="mt-5 flex justify-end">
          <button
            ref={acceptButtonRef}
            type="button"
            onClick={handleAccept}
            className="rounded-xl bg-polaria-teal px-4 py-3 font-semibold text-polaria-on-teal hover:opacity-90"
          >
            {ETIQUETA_ACEPTAR_SESION_EXPIRADA}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
