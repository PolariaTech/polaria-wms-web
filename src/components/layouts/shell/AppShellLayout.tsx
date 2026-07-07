"use client";

import { useCallback, useState } from "react";
import { AuthGuard } from "@/components/auth/guards/AuthGuard";
import { env } from "@/config/env";
import { markMateoSsoExit } from "@/lib/auth/mateo-sso-exit";
import { removeAuthFromLocalStorage } from "@/lib/auth/auth-storage";
import { mateoHandoff, logoutWithToken } from "@/modules/auth";
import { ApiError } from "@/services/api/api";
import { useAuthStore } from "@/stores/auth.store";
import { AppTopbar } from "./AppTopbar";

interface AppShellLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout global de la aplicación autenticada.
 * Incluye topbar compartido para todos los roles y vistas.
 */
export function AppShellLayout({ children }: AppShellLayoutProps) {
  const clearAuthSilently = useAuthStore((s) => s.clearAuthSilently);
  const [mateoLoading, setMateoLoading] = useState(false);
  const [mateoError, setMateoError] = useState<string | null>(null);

  const handleMateoIaClick = useCallback(async () => {
    if (mateoLoading) return;

    setMateoError(null);
    setMateoLoading(true);

    try {
      const accessToken = useAuthStore.getState().accessToken;
      const { code } = await mateoHandoff();
      const mateoBaseUrl = env.mateoUrl.replace(/\/$/, "");
      const mateoUrl = `${mateoBaseUrl}/auth/sso?code=${encodeURIComponent(code)}`;

      // iOS Safari: marcar salida SSO antes de limpiar sesión para que AuthGuard
      // no gane la carrera con router.replace('/login').
      markMateoSsoExit();
      clearAuthSilently();
      removeAuthFromLocalStorage();

      if (accessToken) {
        void logoutWithToken(accessToken).catch(() => {
          // La navegación a Mateo no debe bloquearse por el logout remoto.
        });
      }

      window.location.href = mateoUrl;
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
  }, [clearAuthSilently, mateoLoading]);

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
        />
        {mateoError && (
          <div
            role="alert"
            className="relative z-20 mx-auto w-full max-w-[90rem] px-2 pt-2 sm:px-6 lg:px-8"
          >
            <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-center text-sm text-red-400">
              {mateoError}
            </p>
          </div>
        )}
        <div className="relative z-10 flex flex-1 flex-col">{children}</div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-polaria-teal opacity-40"
        />
      </div>
    </AuthGuard>
  );
}
