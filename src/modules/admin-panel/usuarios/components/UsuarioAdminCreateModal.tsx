"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { PolariaFormInput } from "@/components/shared/form/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { PolariaPasswordStrengthField } from "@/components/shared/form/PolariaPasswordStrengthField";
import { PolariaPhoneInput } from "@/components/shared/form/PolariaPhoneInput";
import {
  isValidInternationalPhone,
  normalizeInternationalPhone,
} from "@/constants/ui/phone-countries";
import { WMS_ROL_LABELS } from "@/constants/wms/wms-roles";
import { WmsRol } from "@/constants/wms/roles";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import {
  analyzePassword,
  normalizePasswordInput,
} from "@/lib/utils/password-strength";
import { useAuthStore } from "@/stores/auth.store";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import { createUsuarioAdmin } from "../services/usuarios-admin.service";

interface UsuarioAdminCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const INITIAL_FORM = {
  nombre: "",
  correo: "",
  telefono: "",
  clave: "",
};

export function UsuarioAdminCreateModal({
  open,
  onClose,
  onCreated,
}: UsuarioAdminCreateModalProps) {
  const { codigoCuenta, codigoEmpresa } = useCompany();
  const session = useAuthStore((state) => state.session);
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const empresaAsignada =
    session?.razonSocialEmpresa ?? codigoEmpresa ?? "—";

  useEffect(() => {
    if (!open) return;

    setForm(INITIAL_FORM);
    setError(null);
    setIsSubmitting(false);
  }, [open]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!codigoCuenta || !codigoEmpresa) {
      setError("No se encontró el contexto de cuenta o empresa.");
      return;
    }

    const clave = normalizePasswordInput(form.clave);
    const passwordAnalysis = analyzePassword(clave);
    if (!passwordAnalysis.isValid) {
      setError(passwordAnalysis.errors[0] ?? "La contraseña no es válida.");
      return;
    }

    const telefono = form.telefono.trim()
      ? normalizeInternationalPhone(form.telefono)
      : "";
    if (telefono && !isValidInternationalPhone(telefono)) {
      setError("Ingresa un número de teléfono válido.");
      return;
    }

    setIsSubmitting(true);

    try {
      await createUsuarioAdmin({
        codigoCuenta,
        codigoEmpresa,
        nombre: form.nombre,
        correo: form.correo,
        telefono: telefono || null,
        clave,
      });
      onCreated();
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof DomainServiceError
          ? err.message
          : "No se pudo asignar el usuario.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PolariaFormModal
      open={open}
      onClose={handleClose}
      sectionLabel="Asignar usuario"
      title="Asignar usuario"
      size="md"
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      error={error}
      isSubmitting={isSubmitting}
      submitLabel="Asignar"
    >
      <div className="flex flex-col gap-3">
        <PolariaFormInput
          id="usuario-admin-nombre"
          label="Nombre"
          value={form.nombre}
          placeholder="Nombre completo"
          onChange={(event) =>
            setForm((current) => ({ ...current, nombre: event.target.value }))
          }
          disabled={isSubmitting}
          autoFocus
        />

        <PolariaFormInput
          id="usuario-admin-rol"
          label="Rol"
          value={WMS_ROL_LABELS[WmsRol.operador_cuenta]}
          readOnly
          disabled
        />

        <PolariaFormInput
          id="usuario-admin-asignado"
          label="Asignado"
          value={empresaAsignada}
          readOnly
          disabled
        />

        <PolariaFormInput
          id="usuario-admin-correo"
          label="Correo"
          type="email"
          autoComplete="email"
          value={form.correo}
          placeholder="correo@empresa.com"
          onChange={(event) =>
            setForm((current) => ({ ...current, correo: event.target.value }))
          }
          disabled={isSubmitting}
        />

        <PolariaPhoneInput
          id="usuario-admin-telefono"
          label="Teléfono"
          value={form.telefono}
          onChange={(value) =>
            setForm((current) => ({ ...current, telefono: value }))
          }
          disabled={isSubmitting}
          hint="Opcional. Formato internacional."
        />

        <PolariaPasswordStrengthField
          id="usuario-admin-clave"
          label="Clave"
          value={form.clave}
          onChange={(value) =>
            setForm((current) => ({ ...current, clave: value }))
          }
          disabled={isSubmitting}
        />
      </div>
    </PolariaFormModal>
  );
}
