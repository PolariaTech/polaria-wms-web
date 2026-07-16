"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  PolariaFormInput,
  PolariaFormSelect,
} from "@/components/shared/form/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { PolariaPhoneInput } from "@/components/shared/form/PolariaPhoneInput";
import { isValidInternationalPhone } from "@/constants/ui/phone-countries";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import {
  updateEmpresaConfigurator,
  type EmpresaListRow,
} from "../services/empresas.service";

interface EmpresaEditModalProps {
  open: boolean;
  empresa: EmpresaListRow | null;
  onClose: () => void;
  onUpdated: () => void;
}

const ESTADO_OPTIONS = [
  { value: "activa", label: "Activa" },
  { value: "inactiva", label: "Inactiva" },
] as const;

export function EmpresaEditModal({
  open,
  empresa,
  onClose,
  onUpdated,
}: EmpresaEditModalProps) {
  const [razonSocial, setRazonSocial] = useState("");
  const [telefono, setTelefono] = useState("");
  const [estado, setEstado] = useState<"activa" | "inactiva">("activa");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !empresa) return;

    setRazonSocial(empresa.razonSocial);
    setTelefono(empresa.telefono ?? "");
    setEstado(empresa.estaActiva ? "activa" : "inactiva");
    setError(null);
    setIsSubmitting(false);
  }, [empresa, open]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!empresa) return;

    setError(null);
    setIsSubmitting(true);

    try {
      if (telefono.trim() && !isValidInternationalPhone(telefono)) {
        setError("Ingresa un número de teléfono válido.");
        setIsSubmitting(false);
        return;
      }

      await updateEmpresaConfigurator({
        codigoEmpresa: empresa.codigoEmpresa,
        razonSocial,
        telefono,
        estaActiva: estado === "activa",
      });
      onUpdated();
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof DomainServiceError
          ? err.message
          : "No se pudo actualizar la empresa.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PolariaFormModal
      open={open}
      onClose={handleClose}
      sectionLabel="Editar empresa"
      title="Editar empresa"
      description="Actualiza los datos de la empresa."
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      error={error}
      isSubmitting={isSubmitting}
      submitLabel="Guardar"
      hideHeaderClose
    >
      <PolariaFormInput
        id="edit-empresa-razon-social"
        label="Razón social"
        value={razonSocial}
        placeholder="Nombre legal de la empresa"
        onChange={(event) => setRazonSocial(event.target.value)}
        disabled={isSubmitting}
        autoFocus
      />

      <PolariaFormInput
        id="edit-empresa-codigo"
        label="Código empresa"
        value={empresa?.codigoEmpresa ?? ""}
        readOnly
        disabled
      />

      <PolariaPhoneInput
        id="edit-empresa-telefono"
        label="Teléfono"
        value={telefono}
        onChange={setTelefono}
        disabled={isSubmitting}
        hint="Opcional. Formato internacional."
      />

      <PolariaFormSelect
        id="edit-empresa-estado"
        label="Estado"
        value={estado}
        onChange={(event) =>
          setEstado(event.target.value === "inactiva" ? "inactiva" : "activa")
        }
        disabled={isSubmitting}
        options={[...ESTADO_OPTIONS]}
      />
    </PolariaFormModal>
  );
}
