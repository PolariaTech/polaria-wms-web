"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { PolariaFormInput } from "@/components/shared/form/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { PolariaPhoneInput } from "@/components/shared/form/PolariaPhoneInput";
import {
  isValidInternationalPhone,
  normalizeInternationalPhone,
} from "@/constants/ui/phone-countries";
import { WMS_ROL_LABELS } from "@/constants/wms/wms-roles";
import { WmsRol } from "@/constants/wms/roles";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { useAuthStore } from "@/stores/auth.store";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import {
  updateUsuarioAdmin,
  type UsuarioAdminListRow,
} from "../services/usuarios-admin.service";

interface UsuarioAdminEditModalProps {
  open: boolean;
  usuario: UsuarioAdminListRow | null;
  onClose: () => void;
  onUpdated: () => void;
}

export function UsuarioAdminEditModal({
  open,
  usuario,
  onClose,
  onUpdated,
}: UsuarioAdminEditModalProps) {
  const { codigoEmpresa } = useCompany();
  const session = useAuthStore((state) => state.session);
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const empresaAsignada =
    session?.razonSocialEmpresa ?? codigoEmpresa ?? "—";

  useEffect(() => {
    if (!open || !usuario) return;

    setNombre(usuario.nombre);
    setCorreo(usuario.correo);
    setTelefono(usuario.telefono === "—" ? "" : usuario.telefono);
    setError(null);
    setIsSubmitting(false);
  }, [open, usuario]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!usuario) return;

    setError(null);

    const telefonoNormalizado = telefono.trim()
      ? normalizeInternationalPhone(telefono)
      : "";
    if (telefonoNormalizado && !isValidInternationalPhone(telefonoNormalizado)) {
      setError("Ingresa un número de teléfono válido.");
      return;
    }

    setIsSubmitting(true);

    try {
      await updateUsuarioAdmin({
        idUsuario: usuario.idUsuario,
        nombre,
        correo,
        telefono: telefonoNormalizado || null,
      });
      onUpdated();
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof DomainServiceError
          ? err.message
          : "No se pudo actualizar el usuario.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PolariaFormModal
      open={open}
      onClose={handleClose}
      sectionLabel="Editar usuario"
      title="Editar usuario"
      description="Puedes cambiar cualquier dato excepto el código."
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      error={error}
      isSubmitting={isSubmitting}
      submitLabel="Guardar"
      compact
    >
      <PolariaFormInput
        id="edit-usuario-admin-codigo"
        label="Código"
        value={usuario?.codigo ?? ""}
        readOnly
        disabled
        compact
      />

      <PolariaFormInput
        id="edit-usuario-admin-nombre"
        label="Nombre"
        value={nombre}
        placeholder="Nombre completo"
        onChange={(event) => setNombre(event.target.value)}
        disabled={isSubmitting}
        autoFocus
        compact
      />

      <PolariaFormInput
        id="edit-usuario-admin-rol"
        label="Rol"
        value={WMS_ROL_LABELS[WmsRol.operador_cuenta]}
        readOnly
        disabled
        compact
      />

      <PolariaFormInput
        id="edit-usuario-admin-asignado"
        label="Asignado"
        value={empresaAsignada}
        readOnly
        disabled
        compact
      />

      <PolariaFormInput
        id="edit-usuario-admin-correo"
        label="Correo"
        type="email"
        autoComplete="email"
        value={correo}
        placeholder="correo@empresa.com"
        onChange={(event) => setCorreo(event.target.value)}
        disabled={isSubmitting}
        compact
      />

      <PolariaPhoneInput
        id="edit-usuario-admin-telefono"
        label="Teléfono"
        value={telefono}
        onChange={setTelefono}
        disabled={isSubmitting}
        hint="Opcional. Formato internacional."
        compact
      />
    </PolariaFormModal>
  );
}
