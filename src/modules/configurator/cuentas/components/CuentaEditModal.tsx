"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  PolariaFormInput,
  PolariaFormSelect,
} from "@/components/shared/form/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import {
  updateCuentaConfigurator,
  type CuentaListRow,
} from "../services/cuentas.service";

interface CuentaEditModalProps {
  open: boolean;
  cuenta: CuentaListRow | null;
  onClose: () => void;
  onUpdated: () => void;
}

const CREDENCIALES_OPTIONS = [
  { value: "si", label: "Sí" },
  { value: "no", label: "No" },
] as const;

export function CuentaEditModal({
  open,
  cuenta,
  onClose,
  onUpdated,
}: CuentaEditModalProps) {
  const [nombre, setNombre] = useState("");
  const [credenciales, setCredenciales] = useState<"si" | "no">("si");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !cuenta) return;

    setNombre(cuenta.nombreComercial);
    setCredenciales(cuenta.estaActiva ? "si" : "no");
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
        nombreComercial: nombre,
        estaActiva: credenciales === "si",
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
      sectionLabel="Editar cuenta"
      title="Editar cuenta"
      description="Actualiza el nombre y las credenciales de acceso."
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

      <PolariaFormSelect
        id="edit-cuenta-credenciales"
        label="Credenciales"
        value={credenciales}
        onChange={(event) =>
          setCredenciales(event.target.value === "no" ? "no" : "si")
        }
        disabled={isSubmitting}
        options={[...CREDENCIALES_OPTIONS]}
        hint="Si eliges No, los usuarios de esta cuenta no podrán iniciar sesión."
      />
    </PolariaFormModal>
  );
}
