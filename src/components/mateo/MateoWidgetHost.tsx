"use client";

import { useEffect, useRef, useState } from "react";
import { usePolariaToast } from "@/components/shared/toast/PolariaToastProvider";
import { env } from "@/config/env";
import { apiRequest } from "@/services/api/api";
import { useAuthStore } from "@/stores/auth.store";
import { loadMateoWidgetApi } from "./load-mateo-widget";
import type {
  MateoWidgetApi,
  MateoWidgetTokenResponse,
} from "./mateo-widget.types";

/**
 * Chat flotante Mateo Support — solo con sesión autenticada en el shell.
 * No reemplaza el SSO full-page del topbar; no hace logout del shell en onAuthError.
 */
export function MateoWidgetHost() {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const { showToast } = usePolariaToast();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<MateoWidgetApi | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isHydrated || !accessToken) {
      setReady(false);
      return;
    }

    let cancelled = false;
    const wmsToken = accessToken;

    const fetchWidgetToken = () =>
      apiRequest<MateoWidgetTokenResponse>("/auth/mateo/widget-token", {
        method: "POST",
        auth: true,
      });

    const handleAuthError = () => {
      apiRef.current?.close?.();
      showToast({
        variant: "error",
        title: "Sesión expirada",
        content:
          "El chat Mateo necesita un token nuevo. Recarga o vuelve a abrir el widget.",
      });
    };

    void (async () => {
      // Esperar un frame para asegurar que el ref del contenedor ya está montado.
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });
      if (cancelled) return;

      const hostEl = hostRef.current;
      if (!hostEl) {
        console.warn("[MateoWidgetHost] contenedor no montado");
        return;
      }

      try {
        const api = await loadMateoWidgetApi(env.mateoWidgetScriptUrl);
        if (cancelled) return;

        api.configureTokenFetcher(fetchWidgetToken);
        apiRef.current = api;

        await api.mount(hostEl, {
          shadowDom: true,
          conversationApiBase: "/api/mateo/conversaciones",
          conversationTokenFetcher: async () => ({
            token: wmsToken,
            expiresIn: 3600,
          }),
          onAuthError: handleAuthError,
        });

        if (!cancelled) setReady(true);
      } catch (err) {
        console.error("[MateoWidgetHost] no se pudo cargar el widget:", err);
        if (!cancelled) {
          setReady(false);
          showToast({
            variant: "error",
            title: "Mateo widget",
            content:
              err instanceof Error
                ? err.message
                : "No se pudo cargar el chat flotante. Revisa NEXT_PUBLIC_MATEO_WIDGET_SCRIPT_URL.",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
      const api = apiRef.current;
      const hostEl = hostRef.current;
      if (api && hostEl) {
        api.unmount?.(hostEl);
        api.close?.();
      }
      apiRef.current = null;
    };
  }, [accessToken, isHydrated, showToast]);

  if (!isHydrated || !accessToken) {
    return null;
  }

  // El launcher del widget ya se posiciona con `fixed` en el viewport.
  // No poner el host en `fixed` con tamaño 0: puede ocultar el botón.
  return (
    <div
      ref={hostRef}
      data-testid="mateo-widget-host"
      data-ready={ready ? "true" : "false"}
      className="relative z-[100]"
      aria-live="polite"
    />
  );
}
