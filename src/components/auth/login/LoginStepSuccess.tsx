"use client";

import { Check } from "lucide-react";
import {
  getSessionDisplayName,
  getSessionDomainLabel,
} from "@/lib/auth/auth-session";
import type { AuthSession } from "@/types/auth/auth";

interface LoginStepSuccessProps {
  session: AuthSession;
}

export function LoginStepSuccess({ session }: LoginStepSuccessProps) {
  const nombre = getSessionDisplayName(session);
  const domainLabel = getSessionDomainLabel(session);

  return (
    <div className="polaria-card-glow rounded-2xl border border-polaria-t-20 bg-polaria-t-08 p-6 backdrop-blur-xl sm:p-8">
      <div className="flex flex-col items-center text-center">
        <div className="polaria-teal-glow mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-polaria-teal">
          <Check className="h-10 w-10 text-polaria-bg" strokeWidth={3} />
        </div>

        <h2 className="text-2xl font-bold text-polaria-w">
          ¡Bienvenido, {nombre}!
        </h2>
        <p className="mt-2 text-sm text-polaria-w-50">Autenticación exitosa</p>

        <div className="mt-8 w-full rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-5 py-5">
          <p className="text-sm text-polaria-w-50">Sesión iniciada como</p>
          <p className="mt-1 text-xl font-semibold text-polaria-teal">{nombre}</p>
          <p className="mt-1 text-sm text-polaria-w-50">{domainLabel}</p>
        </div>
      </div>
    </div>
  );
}
