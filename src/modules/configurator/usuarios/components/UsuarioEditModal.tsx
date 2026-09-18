"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { PolariaFormInput } from "@/components/shared/form/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { PolariaPhoneInput } from "@/components/shared/form/PolariaPhoneInput";
import {
  isValidInternationalPhone,
  normalizeInternationalPhone,
} from "@/constants/ui/phone-countries";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { CuentaAccesoGrantPanel } from "@/modules/configurator/cuentas/components/CuentaAccesoGrantPanel";
import {
  updateUsuarioConfigurator,
  type UsuarioListRow,
} from "../services/usuarios.service";

interface UsuarioEditModalProps {
  open: boolean;
  usuario: UsuarioListRow | null;
  onClose: () => void;
  onUpdated: () => void;
}

export function UsuarioEditModal({
  open,
  usuario,
  onClose,
  onUpdated,
}: UsuarioEditModalProps) {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [estaActivo, setEstaActivo] = useState(true);
  const [accesoWms, setAccesoWms] = useState(true);
  const [accesoMateo, setAccesoMateo] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !usuario) return;

    setNombre(usuario.nombre);
    setCorreo(usuario.correo === "—" ? "" : usuario.correo);
    setTelefono(usuario.telefono === "—" ? "" : usuario.telefono);
    setEstaActivo(usuario.estaActivo);
    setAccesoWms(usuario.accesoWms);
    setAccesoMateo(usuario.accesoMateo);
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

    if (!accesoWms && !accesoMateo) {
      setError("El usuario debe tener acceso a Polaria WMS, a Mateo IA, o a ambos.");
      return;
    }

    setIsSubmitting(true);

    try {
      await updateUsuarioConfigurator({
        idUsuario: usuario.idUsuario,
        nombre,
        correo,
        telefono: telefonoNormalizado || null,
        estaActivo,
        accesoWms,
        accesoMateo,
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
      sectionLabel="Acceso"
      title="Editar usuario"
      description="Concede o revoca el inicio de sesión y los productos de este usuario."
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      error={error}
      isSubmitting={isSubmitting}
      submitLabel="Guardar"
      hideHeaderClose
    >
      <PolariaFormInput
        id="edit-usuario-codigo"
        label="Código"
        value={usuario?.codigo ?? ""}
        readOnly
        disabled
      />

      <PolariaFormInput
        id="edit-usuario-rol"
        label="Rol"
        value={usuario?.rol ?? ""}
        readOnly
        disabled
      />

      <PolariaFormInput
        id="edit-usuario-nombre"
        label="Nombre"
        value={nombre}
        onChange={(event) => setNombre(event.target.value)}
        disabled={isSubmitting}
        autoFocus
      />

      <PolariaFormInput
        id="edit-usuario-correo"
        label="Correo"
        type="email"
        value={correo}
        onChange={(event) => setCorreo(event.target.value)}
        disabled={isSubmitting}
      />

      <PolariaPhoneInput
        id="edit-usuario-telefono"
        label="Teléfono"
        value={telefono}
        onChange={setTelefono}
        disabled={isSubmitting}
        hint="Opcional. Formato internacional."
      />

      <CuentaAccesoGrantPanel
        estaActiva={estaActivo}
        accesoWms={accesoWms}
        accesoMateo={accesoMateo}
        disabled={isSubmitting}
        ariaLabel="Accesos del usuario"
        loginOnCaption="Este usuario puede iniciar sesión."
        loginOffCaption="Este usuario no puede iniciar sesión."
        onToggleActiva={() => setEstaActivo((current) => !current)}
        onToggleWms={() => {
          if (accesoWms && !accesoMateo) return;
          setAccesoWms((current) => !current);
        }}
        onToggleMateo={() => {
          if (accesoMateo && !accesoWms) return;
          setAccesoMateo((current) => !current);
        }}
      />
    </PolariaFormModal>
  );
}
