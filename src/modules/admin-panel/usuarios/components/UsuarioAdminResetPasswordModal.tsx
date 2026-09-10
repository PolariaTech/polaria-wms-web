"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { PolariaPasswordStrengthField } from "@/components/shared/form/PolariaPasswordStrengthField";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import {
  analyzePassword,
  normalizePasswordInput,
} from "@/lib/utils/password-strength";
import {
  resetUsuarioAdminPassword,
  type UsuarioAdminListRow,
} from "../services/usuarios-admin.service";

interface UsuarioAdminResetPasswordModalProps {
  open: boolean;
  usuario: UsuarioAdminListRow | null;
  onClose: () => void;
  onReset: () => void;
}

export function UsuarioAdminResetPasswordModal({
  open,
  usuario,
  onClose,
  onReset,
}: UsuarioAdminResetPasswordModalProps) {
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    setClave("");
    setError(null);
    setIsSubmitting(false);
  }, [open]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!usuario) return;

    setError(null);

    const nextClave = normalizePasswordInput(clave);
    const passwordAnalysis = analyzePassword(nextClave);
    if (!passwordAnalysis.isValid) {
      setError(passwordAnalysis.errors[0] ?? "La contraseña no es válida.");
      return;
    }

    setIsSubmitting(true);

    try {
      await resetUsuarioAdminPassword({
        idUsuario: usuario.idUsuario,
        clave: nextClave,
      });
      onReset();
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof DomainServiceError
          ? err.message
          : "No se pudo restablecer la contraseña.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PolariaFormModal
      open={open}
      onClose={handleClose}
      sectionLabel="Restablecer contraseña"
      title="Restablecer contraseña"
      description={
        usuario
          ? `Define una nueva contraseña para ${usuario.nombre}.`
          : undefined
      }
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      error={error}
      isSubmitting={isSubmitting}
      submitLabel="Restablecer"
      compact
      stackLevel="elevated"
    >
      <PolariaPasswordStrengthField
        id="reset-usuario-admin-clave"
        label="Nueva contraseña"
        value={clave}
        onChange={setClave}
        disabled={isSubmitting}
        placeholder="Nueva contraseña"
        compact
      />
    </PolariaFormModal>
  );
}
