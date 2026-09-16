"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPostLoginRoute } from "@/config/routes";
import { useAuthStore } from "@/stores/auth.store";
import { PerfilDatosForm } from "./PerfilDatosForm";
import { PerfilIdentityCard } from "./PerfilIdentityCard";
import { PerfilPasswordForm } from "./PerfilPasswordForm";

export function PerfilPageContent() {
  const session = useAuthStore((s) => s.session);
  const setSession = useAuthStore((s) => s.setSession);

  if (!session) {
    return null;
  }

  const homeHref = getPostLoginRoute(session.scope);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-4">
        <nav aria-label="Ruta" className="polaria-text-body-sm text-polaria-w-50">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link
                href={homeHref}
                className="inline-flex items-center gap-1.5 transition hover:text-polaria-teal"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                Inicio
              </Link>
            </li>
            <li aria-hidden className="text-polaria-w-20">
              /
            </li>
            <li className="font-medium text-polaria-teal" aria-current="page">
              Perfil
            </li>
          </ol>
        </nav>

        <div>
          <p className="polaria-text-label">Cuenta</p>
          <h1 className="polaria-text-display mt-2">Configuración de perfil</h1>
          <p className="polaria-text-subtitle mt-2 max-w-2xl">
            Identidad a la izquierda, edición y seguridad a la derecha. El correo,
            el usuario y el rol los administra la organización.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(17rem,20rem)_minmax(0,1fr)]">
        <PerfilIdentityCard session={session} />
        <div className="flex min-w-0 flex-col gap-6">
          <PerfilDatosForm session={session} onSessionUpdated={setSession} />
          <PerfilPasswordForm />
        </div>
      </div>
    </main>
  );
}
