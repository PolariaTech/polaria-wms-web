"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { PolariaFormInput } from "@/components/shared/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/PolariaFormModal";
import { WMS_ROL_LABELS } from "@/constants/wms-roles";
import { WmsRol } from "@/constants/roles";
import { DomainServiceError } from "@/lib/domain-service-error";
import { generateCodigoCuentaFromNombre } from "@/lib/generate-codigo-cuenta";
import { useAuthStore } from "@/stores/auth.store";
import { useCompany } from "@/providers/CompanyProvider";
import { createUsuarioAdmin } from "../services/usuarios-admin.service";

interface UsuarioAdminCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const INITIAL_FORM = {
  nombre: "",
  correo: "",
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

  const codigoPreview = useMemo(
    () => generateCodigoCuentaFromNombre(form.nombre),
    [form.nombre],
  );

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

    setIsSubmitting(true);

    try {
      await createUsuarioAdmin({
        codigoCuenta,
        codigoEmpresa,
        nombre: form.nombre,
        correo: form.correo,
        clave: form.clave,
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
      compact
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      error={error}
      isSubmitting={isSubmitting}
      submitLabel="Asignar"
    >
      <div className="flex flex-col gap-3">
        <PolariaFormInput
          id="usuario-admin-id"
          label="ID único"
          value=""
          placeholder="Se genera al guardar"
          readOnly
          disabled
          compact
        />

        <PolariaFormInput
          id="usuario-admin-codigo"
          label="Código"
          value={codigoPreview}
          placeholder="Según el nombre"
          readOnly
          disabled
          compact
        />

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
          compact
        />

        <PolariaFormInput
          id="usuario-admin-rol"
          label="Rol"
          value={WMS_ROL_LABELS[WmsRol.operador_cuenta]}
          readOnly
          disabled
          compact
        />

        <PolariaFormInput
          id="usuario-admin-asignado"
          label="Asignado"
          value={empresaAsignada}
          readOnly
          disabled
          compact
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
          compact
        />

        <PolariaFormInput
          id="usuario-admin-clave"
          label="Clave"
          type="password"
          autoComplete="new-password"
          value={form.clave}
          placeholder="Contraseña inicial"
          onChange={(event) =>
            setForm((current) => ({ ...current, clave: event.target.value }))
          }
          disabled={isSubmitting}
          compact
        />
      </div>
    </PolariaFormModal>
  );
}
