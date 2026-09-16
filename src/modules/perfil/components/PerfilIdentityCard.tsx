import {
  AtSign,
  Building2,
  Landmark,
  Mail,
  Shield,
} from "lucide-react";
import type { AuthSession } from "@/types/auth/auth";
import { PerfilMetaRow, perfilInitials } from "./perfil-ui";

function displayOrEmpty(value: string | null | undefined): string {
  return value?.trim() || "";
}

export function PerfilIdentityCard({ session }: { session: AuthSession }) {
  const empresa = displayOrEmpty(
    session.razonSocialEmpresa ?? session.codigoEmpresa,
  );
  const cuenta = displayOrEmpty(
    session.nombreComercialCuenta ?? session.codigoCuenta,
  );

  return (
    <aside
      aria-label={`Perfil de ${session.nombre}`}
      className="polaria-card-glow overflow-hidden rounded-2xl border border-polaria-t-20 bg-polaria-t-08 backdrop-blur-xl lg:sticky lg:top-6"
    >
      <div className="flex flex-col items-center px-6 pb-6 pt-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-polaria-t-20 bg-polaria-w-08 text-xl font-bold text-polaria-teal shadow-[0_0_28px_var(--teal-glow)]">
          {perfilInitials(session.nombre)}
        </div>
        <h2 className="polaria-gradient-stat mt-4 max-w-full truncate text-xl font-semibold">
          {session.nombre}
        </h2>
        <p className="mt-2 inline-flex rounded-full border border-polaria-t-20 bg-polaria-w-08 px-3 py-1 polaria-text-badge">
          {session.nombreRol}
        </p>
      </div>

      <div className="space-y-4 border-t border-polaria-w-08 px-5 py-5 sm:px-6">
        <p className="polaria-text-label">Datos de acceso</p>
        <PerfilMetaRow icon={Mail} label="Correo" value={session.correo} />
        <PerfilMetaRow icon={AtSign} label="Usuario" value={session.username} />
        <PerfilMetaRow icon={Shield} label="Rol" value={session.nombreRol} />
        <PerfilMetaRow icon={Building2} label="Empresa" value={empresa} />
        <PerfilMetaRow icon={Landmark} label="Cuenta" value={cuenta} />
      </div>
    </aside>
  );
}
