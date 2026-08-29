"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { PolariaFormInput } from "@/components/shared/form/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { PolariaPhoneInput } from "@/components/shared/form/PolariaPhoneInput";
import { isValidInternationalPhone } from "@/constants/ui/phone-countries";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import {
  updateClienteAdmin,
  type ClienteListRow,
} from "../services/clientes.service";

interface ClienteEditModalProps {
  open: boolean;
  cliente: ClienteListRow | null;
  onClose: () => void;
  onUpdated: () => void;
}

export function ClienteEditModal({
  open,
  cliente,
  onClose,
  onUpdated,
}: ClienteEditModalProps) {
  const { codigoCuenta } = useCompany();
  const [nombre, setNombre] = useState("");
  const [nit, setNit] = useState("");
  const [telefono, setTelefono] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !cliente) return;

    setNombre(cliente.nombre);
    setNit(cliente.nit);
    setTelefono(cliente.telefono ?? "");
    setError(null);
    setIsSubmitting(false);
  }, [cliente, open]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!cliente) return;

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
      await updateClienteAdmin({
        codigoCuenta,
        idCliente: cliente.idCliente,
        nombre,
        nit,
        telefono,
      });
      onUpdated();
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof DomainServiceError
          ? err.message
          : "No se pudo actualizar el cliente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PolariaFormModal
      open={open}
      onClose={handleClose}
      sectionLabel="Editar cliente"
      title="Editar cliente"
      description="Actualiza los datos del cliente."
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      error={error}
      isSubmitting={isSubmitting}
      submitLabel="Guardar"
      compact
    >
      <PolariaFormInput
        id="edit-cliente-codigo"
        label="Código"
        value={cliente?.codigo ?? ""}
        readOnly
        disabled
        compact
      />

      <PolariaFormInput
        id="edit-cliente-nombre"
        label="Nombre"
        value={nombre}
        placeholder="Nombre o razón social del cliente"
        onChange={(event) => setNombre(event.target.value)}
        disabled={isSubmitting}
        autoFocus
        compact
      />

      <PolariaFormInput
        id="edit-cliente-nit"
        label="NIT"
        value={nit}
        placeholder="900123456-7"
        onChange={(event) => setNit(event.target.value)}
        disabled={isSubmitting}
        compact
      />

      <PolariaPhoneInput
        id="edit-cliente-telefono"
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
