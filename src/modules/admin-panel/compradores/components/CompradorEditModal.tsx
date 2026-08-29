"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { PolariaFormInput } from "@/components/shared/form/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { PolariaPhoneInput } from "@/components/shared/form/PolariaPhoneInput";
import { isValidInternationalPhone } from "@/constants/ui/phone-countries";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import {
  updateCompradorAdmin,
  type CompradorListRow,
} from "../services/compradores.service";

interface CompradorEditModalProps {
  open: boolean;
  comprador: CompradorListRow | null;
  onClose: () => void;
  onUpdated: () => void;
}

export function CompradorEditModal({
  open,
  comprador,
  onClose,
  onUpdated,
}: CompradorEditModalProps) {
  const { codigoCuenta } = useCompany();
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !comprador) return;

    setNombre(comprador.comprador);
    setTelefono(comprador.telefono ?? "");
    setError(null);
    setIsSubmitting(false);
  }, [comprador, open]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!comprador) return;

    setError(null);

    if (!codigoCuenta) {
      setError("No se encontró la cuenta activa.");
      return;
    }

    if (telefono.trim() && !isValidInternationalPhone(telefono)) {
      setError("Ingresa un número de teléfono válido.");
      return;
    }

    setIsSubmitting(true);

    try {
      await updateCompradorAdmin({
        codigoCuenta,
        idComprador: comprador.idComprador,
        nombre,
        telefono,
      });
      onUpdated();
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof DomainServiceError
          ? err.message
          : "No se pudo actualizar el comprador.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PolariaFormModal
      open={open}
      onClose={handleClose}
      sectionLabel="Editar comprador"
      title="Editar comprador"
      description="Actualiza los datos del comprador."
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      error={error}
      isSubmitting={isSubmitting}
      submitLabel="Guardar"
      compact
    >
      <PolariaFormInput
        id="edit-comprador-codigo"
        label="Código"
        value={comprador?.codigo ?? ""}
        readOnly
        disabled
        compact
      />

      <PolariaFormInput
        id="edit-comprador-nombre"
        label="Nombre del comprador"
        value={nombre}
        placeholder="Nombre del comprador"
        onChange={(event) => setNombre(event.target.value)}
        disabled={isSubmitting}
        autoFocus
        compact
      />

      <PolariaPhoneInput
        id="edit-comprador-telefono"
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
