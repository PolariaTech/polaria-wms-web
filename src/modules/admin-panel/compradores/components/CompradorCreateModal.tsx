"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { isValidInternationalPhone } from "@/constants/ui/phone-countries";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import { useAuthStore } from "@/stores/auth.store";
import { createCompradorAdmin, type CompradorListRow } from "../services/compradores.service";
import {
  emptyAltaFormState,
  fichaFromAltaForm,
  type CompradorAltaFormState,
} from "../utils/comprador-alta";
import { CompradorAltaFormFields } from "./CompradorAltaFormFields";

interface CompradorCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (comprador: CompradorListRow) => void;
  /** Capa al abrir sobre otro modal (p. ej. Nuevo pedido). */
  stackLevel?: "base" | "elevated" | "nested";
}

export function CompradorCreateModal({
  open,
  onClose,
  onCreated,
  stackLevel = "base",
}: CompradorCreateModalProps) {
  const { codigoCuenta } = useCompany();
  const vendedorNombre = useAuthStore(
    (state) => state.session?.nombre?.trim() ?? "",
  );

  const [form, setForm] = useState<CompradorAltaFormState>(() =>
    emptyAltaFormState(vendedorNombre),
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    setForm(emptyAltaFormState(vendedorNombre));
    setError(null);
    setIsSubmitting(false);
  }, [open, vendedorNombre]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!codigoCuenta) {
      setError("No se encontró la cuenta activa.");
      return;
    }

    const ficha = {
      ...fichaFromAltaForm(form),
      vendedor: vendedorNombre,
    };
    const nombre = form.nombreComercial.trim() || ficha.razonSocial.trim();
    if (!nombre) {
      setError("Falta el nombre comercial.");
      return;
    }

    const telefonoPrincipal = form.telefono.trim();
    const telefonoContacto = ficha.contactos
      .map((row) => row.telefono.trim())
      .find((value) => value && isValidInternationalPhone(value));
    const telefonoGuardar = telefonoPrincipal || telefonoContacto || "";

    if (telefonoPrincipal && !isValidInternationalPhone(telefonoPrincipal)) {
      setError("Ingresa un número de teléfono válido.");
      return;
    }

    setIsSubmitting(true);

    try {
      const created = await createCompradorAdmin({
        codigoCuenta,
        nombre,
        telefono: telefonoGuardar,
        ficha,
      });

      onCreated(created);
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof DomainServiceError
          ? err.message
          : "No se pudo crear el comprador.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PolariaFormModal
      open={open}
      onClose={handleClose}
      sectionLabel="Nuevo comprador"
      title="Nuevo comprador"
      description="Completa la ficha del comprador. Las equivalencias se agregan después desde Editar."
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      error={error}
      isSubmitting={isSubmitting}
      submitLabel="Guardar"
      compact
      size="2xl"
      hideHeaderClose
      stackLevel={stackLevel}
    >
      <CompradorAltaFormFields
        form={form}
        onChange={setForm}
        disabled={isSubmitting}
        idPrefix="comprador"
        codigoValue="Se genera al guardar"
        nombreAutoFocus
      />
    </PolariaFormModal>
  );
}
