"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { PolariaFormInput } from "@/components/shared/form/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { PolariaPhoneInput } from "@/components/shared/form/PolariaPhoneInput";
import { isValidInternationalPhone } from "@/constants/ui/phone-countries";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import {
  updateProveedorAdmin,
  type ProveedorListRow,
} from "../services/proveedores.service";

interface ProveedorEditModalProps {
  open: boolean;
  proveedor: ProveedorListRow | null;
  onClose: () => void;
  onUpdated: () => void;
}

export function ProveedorEditModal({
  open,
  proveedor,
  onClose,
  onUpdated,
}: ProveedorEditModalProps) {
  const { codigoCuenta } = useCompany();
  const [empresa, setEmpresa] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !proveedor) return;

    setEmpresa(proveedor.proveedor);
    setNombre(proveedor.nombre);
    setTelefono(proveedor.telefono ?? "");
    setEmail(proveedor.email ?? "");
    setError(null);
    setIsSubmitting(false);
  }, [open, proveedor]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!proveedor) return;

    setError(null);

    if (!codigoCuenta) {
      setError("No se encontró la cuenta activa.");
      return;
    }

    if (!isValidInternationalPhone(telefono)) {
      setError("Ingresa un número de teléfono válido.");
      return;
    }

    setIsSubmitting(true);

    try {
      await updateProveedorAdmin({
        codigoCuenta,
        idProveedor: proveedor.idProveedor,
        proveedor: empresa,
        nombre,
        telefono,
        email,
      });
      onUpdated();
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof DomainServiceError
          ? err.message
          : "No se pudo actualizar el proveedor.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PolariaFormModal
      open={open}
      onClose={handleClose}
      sectionLabel="Editar proveedor"
      title="Editar proveedor"
      description="Actualiza los datos del proveedor."
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      error={error}
      isSubmitting={isSubmitting}
      submitLabel="Guardar"
      compact
    >
      <PolariaFormInput
        id="edit-proveedor-codigo"
        label="Código"
        value={proveedor?.codigo ?? ""}
        readOnly
        disabled
        compact
      />

      <PolariaFormInput
        id="edit-proveedor-empresa"
        label="Proveedor"
        value={empresa}
        placeholder="Nombre de la empresa proveedora"
        onChange={(event) => setEmpresa(event.target.value)}
        disabled={isSubmitting}
        autoFocus
        compact
      />

      <PolariaFormInput
        id="edit-proveedor-nombre"
        label="Nombre"
        value={nombre}
        placeholder="Nombre de contacto"
        onChange={(event) => setNombre(event.target.value)}
        disabled={isSubmitting}
        compact
      />

      <PolariaPhoneInput
        id="edit-proveedor-telefono"
        label="Teléfono"
        value={telefono}
        onChange={setTelefono}
        disabled={isSubmitting}
        compact
      />

      <PolariaFormInput
        id="edit-proveedor-email"
        label="Email"
        type="email"
        value={email}
        placeholder="correo@proveedor.com"
        onChange={(event) => setEmail(event.target.value)}
        disabled={isSubmitting}
        compact
      />
    </PolariaFormModal>
  );
}
