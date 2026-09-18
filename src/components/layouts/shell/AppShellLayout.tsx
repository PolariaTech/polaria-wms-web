"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AuthGuard } from "@/components/auth/guards/AuthGuard";
import { sessionHasMateoAccess, sessionIsMateoOnly } from "@/lib/auth/cuenta-producto-access";
import { redirectToMateoSso } from "@/lib/auth/redirect-to-mateo-sso";
import { ApiError } from "@/services/api/api";
import { useAuthStore } from "@/stores/auth.store";
import { POLARIA_PRODUCT_VERSION } from "@/constants/brand/brand";
import { PolariaStatusLoading } from "@/components/shared/status/PolariaStatusLoading";
import { AppTopbar } from "./AppTopbar";
import { MateoWidgetHost } from "@/components/mateo/MateoWidgetHost";

interface AppShellLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout global de la aplicación autenticada.
 * Incluye topbar compartido para todos los roles y vistas.
 */
export function AppShellLayout({ children }: AppShellLayoutProps) {
  const session = useAuthStore((s) => s.session);
  const [mateoLoading, setMateoLoading] = useState(false);
  const [mateoError, setMateoError] = useState<string | null>(null);
  const mateoOnlyRedirectRef = useRef(false);
  const showMateoIa = session ? sessionHasMateoAccess(session) : false;
  const mateoOnly = session ? sessionIsMateoOnly(session) : false;

  const handleMateoIaClick = useCallback(async () => {
    if (mateoLoading) return;

    setMateoError(null);
    setMateoLoading(true);

    try {
      await redirectToMateoSso();
    } catch (err) {
      setMateoLoading(false);
      if (err instanceof ApiError) {
        const isMissingHandoff =
          err.status === 404 &&
          err.message.toLowerCase().includes("mateo-handoff");
        setMateoError(
          isMissingHandoff
            ? "Mateo IA no está disponible: el API aún no tiene desplegado POST /auth/mateo-handoff."
            : err.message,
        );
      } else {
        setMateoError("No se pudo abrir Mateo IA. Intenta de nuevo.");
      }
    }
  }, [mateoLoading]);

  useEffect(() => {
    if (!mateoOnly || mateoOnlyRedirectRef.current) return;
    mateoOnlyRedirectRef.current = true;
    void handleMateoIaClick();
  }, [handleMateoIaClick, mateoOnly]);

  return (
    <AuthGuard>
      <div className="relative flex min-h-screen flex-col bg-polaria-bg">
        <div
          aria-hidden
          className="polaria-aurora pointer-events-none absolute inset-0"
        />
        <AppTopbar
          onMateoIaClick={handleMateoIaClick}
          isMateoLoading={mateoLoading}
          showMateoIa={showMateoIa && !mateoOnly}
        />
        {mateoError && (
          <div
            role="alert"
            className="relative z-20 mx-auto w-full max-w-[90rem] px-2 pt-2 sm:px-6 lg:px-8"
          >
            <p className="rounded-lg border border-polaria-danger-border bg-polaria-danger-bg px-3 py-2 text-center polaria-text-body-sm text-polaria-danger">
              {mateoError}
            </p>
          </div>
        )}
        <div className="relative z-10 flex flex-1 flex-col">
          {mateoOnly ? (
            <PolariaStatusLoading
              title="Abriendo Mateo IA…"
              message="Estamos cerrando Polaria WMS para continuar en Mateo."
              className="m-auto flex-1 py-10"
            />
          ) : (
            children
          )}
        </div>
        {showMateoIa && !mateoOnly ? <MateoWidgetHost /> : null}
        <p
          aria-label={`Versión ${POLARIA_PRODUCT_VERSION}`}
          className={
            process.env.NODE_ENV === "development"
              ? "pointer-events-none fixed bottom-3 left-14 z-30 polaria-text-caption tabular-nums text-polaria-w-20"
              : "pointer-events-none fixed bottom-3 left-3 z-30 polaria-text-caption tabular-nums text-polaria-w-20"
          }
        >
          version: {POLARIA_PRODUCT_VERSION}
        </p>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-polaria-teal opacity-40"
        />
      </div>
    </AuthGuard>
  );
}
