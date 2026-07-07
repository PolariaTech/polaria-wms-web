"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getPostLoginRoute, ROUTES } from "@/config/routes";
import { getMe, wmsSsoExchange } from "@/modules/auth";
import { ApiError } from "@/services/api/api";
import { useAuthStore } from "@/stores/auth.store";

type SsoStatus = "loading" | "error" | "missing-code";

function SsoCard({
  title,
  message,
  children,
}: {
  title: string;
  message: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-polaria-t-20 bg-polaria-t-08 p-8 text-center polaria-card-glow">
      <h1 className="polaria-text-h3 text-polaria-w">{title}</h1>
      <p className="polaria-text-body mt-3 text-polaria-w-50">{message}</p>
      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  );
}

export function SsoLoadingCard() {
  return (
    <SsoCard
      title="Conectando con Polaria WMS…"
      message="Estamos validando tu sesión desde Mateo IA."
    >
      <div
        aria-hidden
        className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-polaria-t-20 border-t-polaria-teal"
      />
    </SsoCard>
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
      <SsoCard
        title="Enlace incompleto"
        message="No recibimos un código de acceso desde Mateo. Abre Polaria WMS desde Mateo IA o inicia sesión manualmente."
      >
        <Link
          href={ROUTES.login}
          className="inline-block rounded-xl bg-polaria-teal px-4 py-3 font-semibold text-polaria-bg hover:opacity-90"
        >
          Ir a iniciar sesión
        </Link>
      </SsoCard>
    );
  }

  if (status === "error") {
    return (
      <SsoCard title="No se pudo conectar" message={errorMessage ?? ""}>
        <Link
          href={ROUTES.login}
          className="inline-block rounded-xl bg-polaria-teal px-4 py-3 font-semibold text-polaria-bg hover:opacity-90"
        >
          Ir a iniciar sesión
        </Link>
      </SsoCard>
    );
  }

  return <SsoLoadingCard />;
}
