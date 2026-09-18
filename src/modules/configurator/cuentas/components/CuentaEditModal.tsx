"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { PolariaFormInput } from "@/components/shared/form/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import {
  updateCuentaConfigurator,
  type CuentaListRow,
} from "../services/cuentas.service";
import { CuentaAccesoGrantPanel } from "./CuentaAccesoGrantPanel";

interface CuentaEditModalProps {
  open: boolean;
  cuenta: CuentaListRow | null;
  onClose: () => void;
  onUpdated: () => void;
}

export function CuentaEditModal({
  open,
  cuenta,
  onClose,
  onUpdated,
}: CuentaEditModalProps) {
  const [nombre, setNombre] = useState("");
  const [estaActiva, setEstaActiva] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !cuenta) return;

    setNombre(cuenta.nombreComercial);
    setEstaActiva(cuenta.estaActiva);
    setError(null);
    setIsSubmitting(false);
  }, [cuenta, open]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!cuenta) return;

    setError(null);
    setIsSubmitting(true);

    try {
      await updateCuentaConfigurator({
        codigoCuenta: cuenta.codigoCuenta,
        codigoEmpresa: cuenta.codigoEmpresa,
        nombreComercial: nombre,
        estaActiva,
      });
      onUpdated();
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof DomainServiceError
          ? err.message
          : "No se pudo actualizar la cuenta.",
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
      title="Editar cuenta"
      description="El inicio de sesión de la cuenta aplica a todos sus usuarios. WMS y Mateo se conceden en cada usuario."
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      error={error}
      isSubmitting={isSubmitting}
      submitLabel="Guardar"
      hideHeaderClose
    >
      <PolariaFormInput
        id="edit-cuenta-nombre"
        label="Nombre"
        value={nombre}
        placeholder="Nombre de la cuenta"
        onChange={(event) => setNombre(event.target.value)}
        disabled={isSubmitting}
        autoFocus
      />

      <PolariaFormInput
        id="edit-cuenta-codigo"
        label="Código"
        value={cuenta?.codigoCuenta ?? ""}
        readOnly
        disabled
      />

      <PolariaFormInput
        id="edit-cuenta-credenciales"
        label="Credenciales (Auth)"
        value={cuenta?.tieneCredenciales ? "Sí" : "No"}
        readOnly
        disabled
        hint="Correo y clave de Auth. Se crean al dar de alta usuarios de esta cuenta."
      />

      <CuentaAccesoGrantPanel
        estaActiva={estaActiva}
        accesoWms
        accesoMateo
        showProductos={false}
        disabled={isSubmitting}
        ariaLabel="Acceso de la cuenta"
        loginOnCaption="Los usuarios de esta cuenta pueden entrar."
        loginOffCaption="Nadie de esta cuenta puede iniciar sesión."
        onToggleActiva={() => setEstaActiva((current) => !current)}
      />
    </PolariaFormModal>
  );
}
