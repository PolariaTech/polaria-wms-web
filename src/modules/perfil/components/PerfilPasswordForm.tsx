"use client";

import { useState, type FormEvent } from "react";
import { Loader2, LockKeyhole } from "lucide-react";
import { PolariaFormInput } from "@/components/shared/form/PolariaFormField";
import { PolariaPasswordStrengthField } from "@/components/shared/form/PolariaPasswordStrengthField";
import { changePassword } from "@/modules/auth";
import { ApiError } from "@/services/api/api";
import {
  analyzePassword,
  normalizePasswordInput,
} from "@/lib/utils/password-strength";
import {
  PerfilAlert,
  PerfilSection,
  perfilPrimaryButtonClass,
} from "./perfil-ui";

export function PerfilPasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const current = normalizePasswordInput(currentPassword);
    const next = normalizePasswordInput(newPassword);
    const confirm = normalizePasswordInput(confirmPassword);

    if (!current) {
      setError("Ingresa tu contraseña actual.");
      return;
    }

    const analysis = analyzePassword(next);
    if (!analysis.isValid) {
      setError(analysis.errors[0] ?? "La nueva contraseña no es válida.");
      return;
    }

    if (next !== confirm) {
      setError("La confirmación no coincide con la nueva contraseña.");
      return;
    }

    if (current === next) {
      setError("La nueva contraseña debe ser distinta a la actual.");
      return;
    }

    setIsSaving(true);
    try {
      await changePassword({
        currentPassword: current,
        newPassword: next,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess("Contraseña actualizada.");
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 401) {
        setError("La contraseña actual no es correcta.");
      } else {
        setError(
          err instanceof ApiError
            ? err.message
            : "No se pudo cambiar la contraseña.",
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PerfilSection
        icon={LockKeyhole}
        kicker="Seguridad"
        title="Contraseña"
        description="Confirma tu clave actual y define una nueva que cumpla los requisitos."
        footer={
          <button
            type="submit"
            disabled={isSaving}
            className={perfilPrimaryButtonClass}
          >
            {isSaving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Actualizar contraseña"
            )}
          </button>
        }
      >
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="flex flex-col gap-5">
            <PolariaFormInput
              id="perfil-password-actual"
              label="Contraseña actual"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
            <PolariaFormInput
              id="perfil-password-confirmar"
              label="Confirmar nueva contraseña"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          <PolariaPasswordStrengthField
            id="perfil-password-nueva"
            label="Nueva contraseña"
            value={newPassword}
            onChange={setNewPassword}
            placeholder="Nueva contraseña"
            autoComplete="new-password"
            compact
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
