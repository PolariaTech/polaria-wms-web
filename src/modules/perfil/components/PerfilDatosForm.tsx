"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2, UserRound } from "lucide-react";
import { PolariaFormInput } from "@/components/shared/form/PolariaFormField";
import { PolariaPhoneInput } from "@/components/shared/form/PolariaPhoneInput";
import { updateMe } from "@/modules/auth";
import { ApiError } from "@/services/api/api";
import type { AuthSession } from "@/types/auth/auth";
import {
  PerfilAlert,
  PerfilSection,
  perfilGhostButtonClass,
  perfilPrimaryButtonClass,
} from "./perfil-ui";

interface PerfilDatosFormProps {
  session: AuthSession;
  onSessionUpdated: (session: AuthSession) => void;
}

export function PerfilDatosForm({
  session,
  onSessionUpdated,
}: PerfilDatosFormProps) {
  const [nombre, setNombre] = useState(session.nombre);
  const [telefono, setTelefono] = useState(session.telefono ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setNombre(session.nombre);
    setTelefono(session.telefono ?? "");
  }, [session]);

  const dirty =
    nombre.trim() !== session.nombre.trim() ||
    telefono.trim() !== (session.telefono ?? "").trim();

  const handleReset = () => {
    setNombre(session.nombre);
    setTelefono(session.telefono ?? "");
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const nextNombre = nombre.trim();
    if (!nextNombre) {
      setError("El nombre es obligatorio.");
      return;
    }

    setIsSaving(true);
    try {
      const nextSession = await updateMe({
        nombre: nextNombre,
        telefono: telefono.trim() || null,
      });
      onSessionUpdated(nextSession);
      setSuccess("Datos del perfil actualizados.");
    } catch (err: unknown) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudieron guardar los cambios.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PerfilSection
        icon={UserRound}
        kicker="Identidad"
        title="Datos personales"
        description="Actualiza cómo te ven en Polaria. El correo no se puede cambiar desde aquí."
        footer={
          <>
            <button
              type="button"
              onClick={handleReset}
              disabled={isSaving || !dirty}
              className={perfilGhostButtonClass}
            >
              Descartar
            </button>
            <button
              type="submit"
              disabled={isSaving || !dirty}
              className={perfilPrimaryButtonClass}
            >
              {isSaving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Guardar cambios"
              )}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <PolariaFormInput
            id="perfil-nombre"
            label="Nombre"
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            required
            autoComplete="name"
            maxLength={255}
          />
          <PolariaPhoneInput
            id="perfil-telefono"
            label="Teléfono"
            value={telefono}
            onChange={setTelefono}
            hint="Opcional. Formato internacional."
          />
        </div>

        <div className="mt-5 space-y-3">
          {error ? <PerfilAlert tone="error">{error}</PerfilAlert> : null}
          {success ? <PerfilAlert tone="success">{success}</PerfilAlert> : null}
        </div>
      </PerfilSection>
    </form>
  );
}
