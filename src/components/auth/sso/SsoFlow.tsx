"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getPostLoginRoute, ROUTES } from "@/config/routes";
import { getMe, wmsSsoExchange } from "@/modules/auth";
import { ApiError } from "@/services/api/api";
import { useAuthStore } from "@/stores/auth.store";
import {
  AuthLoadingSpinner,
  AuthStatusCard,
} from "@/components/layouts/auth/AuthStatusCard";

type SsoStatus = "loading" | "error" | "missing-code";

export function SsoLoadingCard() {
  return (
    <AuthStatusCard
      title="Conectando con Polaria WMS…"
      message="Estamos validando tu sesión desde Mateo IA."
    >
      <AuthLoadingSpinner />
    </AuthStatusCard>
  );
}

export function SsoFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const setTokens = useAuthStore((s) => s.setTokens);
  const setSession = useAuthStore((s) => s.setSession);
  const [status, setStatus] = useState<SsoStatus>(code ? "loading" : "missing-code");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;

    const authCode = code.trim();
    if (!authCode) return;

    let cancelled = false;

    async function exchange() {
      try {
        const response = await wmsSsoExchange(authCode);
        if (cancelled) return;

        setTokens(
          {
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
          },
          { scope: response.user.scope },
        );

        const session = await getMe();
        if (cancelled) return;

        setSession(session);
        router.replace(getPostLoginRoute(session.scope));
      } catch (err) {
        if (cancelled) return;
        setStatus("error");

        if (err instanceof ApiError) {
          setErrorMessage(
            err.status === 401
              ? "El código de acceso expiró o no es válido. Vuelve a iniciar sesión en Mateo e intenta de nuevo."
              : err.message,
          );
        } else {
          setErrorMessage(
            "No se pudo conectar con Polaria WMS. Intenta de nuevo.",
          );
        }
      }
    }

    void exchange();

    return () => {
      cancelled = true;
    };
  }, [code, router, setSession, setTokens]);

  if (status === "missing-code") {
    return (
      <AuthStatusCard
        title="Enlace incompleto"
        message="No recibimos un código de acceso desde Mateo. Abre Polaria WMS desde Mateo IA o inicia sesión manualmente."
      >
        <Link
          href={ROUTES.login}
          className="inline-block rounded-xl bg-polaria-teal px-4 py-3 font-semibold text-polaria-bg hover:opacity-90"
        >
          Ir a iniciar sesión
        </Link>
      </AuthStatusCard>
    );
  }

  if (status === "error") {
    return (
      <AuthStatusCard title="No se pudo conectar" message={errorMessage ?? ""}>
        <Link
          href={ROUTES.login}
          className="inline-block rounded-xl bg-polaria-teal px-4 py-3 font-semibold text-polaria-bg hover:opacity-90"
        >
          Ir a iniciar sesión
        </Link>
      </AuthStatusCard>
    );
  }

  return <SsoLoadingCard />;
}
